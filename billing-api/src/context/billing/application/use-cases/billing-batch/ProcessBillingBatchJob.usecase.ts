// src/billing/application/use-cases/billing-batches/process-billing-batch-job.usecase.ts

import { BillingBatchRepository } from "../../ports/repositories/billing-batch.repository";
import { BillingPendingRepository } from "../../ports/repositories/billing-pending.repository";
import { InvoiceRepository } from "../../ports/repositories/invoice.repository";
import { TransactionManager } from "../../ports/services/transaction-manager.port";
import { InvoiceNumbering } from "../../ports/services/invoice-numbering.port";
import { CaeGenerator } from "../../ports/services/cae-generator.port";
import { Errors } from "../../../../shared/application/errors/errors";
import { AppError } from "../../../../shared/application/errors/app-error";
import { BillingPendingStatus} from "../../../domain/billing-pending/billing-pending.enum";
import { BillingBatchStatus } from "../../../domain/billing-batch/billing-batch.enum";

/**
 * Payload que llega desde la cola.
 * - attempt: para backoff / retries
 * - correlationId: útil para logs (opcional)
 */
export type ProcessBillingBatchJobInput = {
  batchId: number;
  pendingIds: number[];
  attempt?: number;
  correlationId?: string;
};

export type ProcessBillingBatchJobOutput = {
  batchId: number;
  status: BillingBatchStatus;
  invoicesCreated: number;
  errorMessage?: string | null;
};

/**
 * Use case que corre dentro de un Worker/Job.
 *
 * Reglas:
 * - Idempotencia: si el batch ya está PROCESSED, no hace nada.
 * - Consistencia: si falla, batch queda ERROR con errorMessage.
 * - Concurrencia: se apoya en lock de pendings + constraints DB (UNIQUE pendingId).
 */
export class ProcessBillingBatchJobUseCase {
  constructor(
    private readonly tx: TransactionManager,
    private readonly batches: BillingBatchRepository,
    private readonly pendings: BillingPendingRepository,
    private readonly invoices: InvoiceRepository,
    private readonly numbering: InvoiceNumbering,
    private readonly cae: CaeGenerator,
  ) {}

  async execute(
    input: ProcessBillingBatchJobInput,
  ): Promise<ProcessBillingBatchJobOutput> {
    if (!input.batchId) throw Errors.Validation("batchId is required");
    if (!Array.isArray(input.pendingIds) || input.pendingIds.length === 0) {
      throw Errors.Validation("pendingIds must be a non-empty array");
    }

    const batch = await this.batches.findById(input.batchId);
    if (!batch)
      throw Errors.NotFound("BillingBatch", { batchId: input.batchId });

    // ✅ Idempotencia por estado: si ya está procesado, salimos sin re-procesar
    if (batch.status === BillingBatchStatus.PROCESSED) {
      const existing = await this.invoices.listByBatchId(batch.id);
      return {
        batchId: batch.id,
        status: BillingBatchStatus.PROCESSED,
        invoicesCreated: existing.length,
        errorMessage: null,
      };
    }

    // (Opcional) si usás estados async:
    // - si está IN_PROGRESS y llega otro worker, podés abortar.
    // - o dejar que el lock DB/constraints lo maneje.
    // Acá lo hago conservador:
    if (batch.status === (BillingBatchStatus as any).IN_PROGRESS) {
      throw Errors.Conflict("Batch is already being processed", {
        batchId: batch.id,
      });
    }

    // Marcamos "en proceso" antes de arrancar (si existe ese estado).
    // Si tu enum no lo tiene, podés comentar esta línea.
    try {
      if ((BillingBatchStatus as any).IN_PROGRESS) {
        await this.batches.setStatus(
          batch.id,
          (BillingBatchStatus as any).IN_PROGRESS,
          null,
        );
      }

      const createdInvoices = await this.tx.runInTransaction(async () => {
        // 1) Lock de pendings (SELECT ... FOR UPDATE en infra)
        const locked = await this.pendings.lockByIds(input.pendingIds);

        // 2) Validaciones duras
        const lockedIds = new Set(locked.map((p) => p.id));
        const missing = input.pendingIds.filter((id) => !lockedIds.has(id));
        if (missing.length) {
          throw Errors.Validation("Some pendings do not exist", { missing });
        }

        const notEligible = locked.filter(
          (p) => p.status !== BillingPendingStatus.PENDING,
        );
        if (notEligible.length) {
          // Idempotencia parcial: si ya están INVOICED, podrías ignorarlos,
          // pero normalmente esto es señal de conflicto en selección.
          throw Errors.Conflict("Some pendings are not available for billing", {
            notEligible: notEligible.map((p) => ({
              id: p.id,
              status: p.status,
            })),
          });
        }

        // 3) Evitar duplicar si por retry ya se crearon invoices
        // (extra safety: si tu constraint UNIQUE(pendingId) existe, esto no pasa,
        // pero con retry te conviene chequear para devolver resultado idempotente)
        const alreadyInvoiced = await Promise.all(
          locked.map((p) => this.invoices.findByPendingId(p.id)),
        );

        const pendingToInvoice = locked.filter(
          (p, idx) => !alreadyInvoiced[idx],
        );
        if (pendingToInvoice.length === 0) {
          return []; // nada para crear; idempotencia
        }

        // 4) Numeración correlativa por talonario
        const invoiceNumbers = await this.numbering.nextInvoiceNumber(
          batch.receiptBook,
          pendingToInvoice.length,
        );

        // 5) Crear invoices
        const invoiceRows = await Promise.all(
          pendingToInvoice.map(async (pending, idx) => {
            const cae = await this.cae.generate();
            return {
              invoiceNumber: invoiceNumbers[idx],
              cae,
              issueDate: batch.issueDate,
              amount: 0, // ⚠️ Ideal: traer amount/customer/serviceDate con join al Service
              batchId: batch.id,
              pendingId: pending.id,
            };
          }),
        );

        const created = await this.invoices.createMany(invoiceRows);

        // 6) Marcar pendings como INVOICED
        await this.pendings.markInvoiced(pendingToInvoice.map((p) => p.id));

        return created;
      });

      await this.batches.setStatus(batch.id, BillingBatchStatus.PROCESSED, null);

      // Para reporting: cuántas invoices tiene el batch (incluye ya creadas por retry)
      const finalInvoices = await this.invoices.listByBatchId(batch.id);

      return {
        batchId: batch.id,
        status: BillingBatchStatus.PROCESSED,
        invoicesCreated: finalInvoices.length,
        errorMessage: null,
      };
    } catch (err: any) {
      const normalized = this.normalizeError(err);

      await this.batches.setStatus(
        batch.id,
        BillingBatchStatus.ERROR,
        normalized.message,
      );

      // Re-lanzá el error para que el worker haga retry si corresponde
      // (BullMQ / SQS etc. deciden por política de reintentos)
      throw err;
    }
  }

  private normalizeError(err: unknown): { code: string; message: string } {
    if (err instanceof AppError) {
      return { code: err.code, message: err.message };
    }
    if (err instanceof Error) {
      return {
        code: "INTERNAL_ERROR",
        message: err.message || "Unexpected error",
      };
    }
    return { code: "INTERNAL_ERROR", message: "Unexpected error" };
  }
}
