// application/use-cases/billing-batches/process-billing-batch.usecase.ts
import { BillingBatchRepository } from "../../ports/repositories/billing-batch.repository";
import { BillingPendingRepository } from "../../ports/repositories/billing-pending.repository";
import { InvoiceRepository } from "../../ports/repositories/invoice.repository";
import { TransactionManager } from "../../ports/services/transaction-manager.port";
import { InvoiceNumbering } from "../../ports/services/invoice-numbering.port";
import { CaeGenerator } from "../../ports/services/cae-generator.port";
import { Errors } from "../../../../shared/application/errors/errors";
import { BillingBatchStatus } from "../../../domain/billing-batch/billing-batch.enum";
import { BillingPendingStatus } from "../../../domain/billing-pending/billing-pending.enum";

export type ProcessBillingBatchInput = {
  batchId: number;
  pendingIds: number[];
};

export type ProcessBillingBatchOutput = {
  batchId: number;
  status: BillingBatchStatus;
  invoicesCreated: number;
  errorMessage?: string | null;
};

export class ProcessBillingBatchUseCase {
  constructor(
    private readonly tx: TransactionManager,
    private readonly batches: BillingBatchRepository,
    private readonly pendings: BillingPendingRepository,
    private readonly invoices: InvoiceRepository,
    private readonly numbering: InvoiceNumbering,
    private readonly cae: CaeGenerator,
  ) {}

  async execute(
    input: ProcessBillingBatchInput,
  ): Promise<ProcessBillingBatchOutput> {
    if (!input.batchId) throw Errors.Validation("batchId is required");
    if (!Array.isArray(input.pendingIds) || input.pendingIds.length === 0) {
      throw Errors.Validation("pendingIds must be a non-empty array");
    }

    const batch = await this.batches.findById(input.batchId);
    if (!batch)
      throw Errors.NotFound("BillingBatch", { batchId: input.batchId });

    try {
      const createdInvoices = await this.tx.runInTransaction(async () => {
        // 1) Lock de pendings (concurrencia)
        const locked = await this.pendings.lockByIds(input.pendingIds);

        // Validación: que estén todos
        const lockedIds = new Set(locked.map((p) => p.id));
        const missing = input.pendingIds.filter((id) => !lockedIds.has(id));
        if (missing.length)
          throw Errors.Validation("Some pendings do not exist", { missing });

        // Validación: solo PENDING
        const notEligible = locked.filter(
          (p) => p.status !== BillingPendingStatus.PENDING,
        );
        if (notEligible.length) {
          throw Errors.Conflict("Some pendings are not available for billing", {
            notEligible: notEligible.map((p) => ({
              id: p.id,
              status: p.status,
            })),
          });
        }

        // 2) Numeración correlativa por talonario (receiptBook)
        const invoiceNumbers = await this.numbering.nextInvoiceNumber(
          batch.receiptBook,
          locked.length,
        );

        // 3) Crear invoices (1:1 con pending)
        const invoiceRows = await Promise.all(
          locked.map(async (pending, idx) => {
            const cae = await this.cae.generate();
            return {
              invoiceNumber: invoiceNumbers[idx],
              cae,
              issueDate: batch.issueDate,
              amount: 0, // 👇 ver nota
              batchId: batch.id,
              pendingId: pending.id,
            };
          }),
        );

        // Nota: el amount real debería venir del Service asociado al pending.
        // Eso lo resolvés en infra (join) o agregando un método repo para "get pending + service amount".
        // Para mantener limpio el ejemplo, lo dejé en 0.

        const created = await this.invoices.createMany(invoiceRows);

        // 4) Marcar pendings como INVOICED
        await this.pendings.markInvoiced(locked.map((p) => p.id));

        return created;
      });

      await this.batches.setStatus(
        batch.id,
        BillingBatchStatus.PROCESSED,
        null,
      );
      return {
        batchId: batch.id,
        status: BillingBatchStatus.PROCESSED,
        invoicesCreated: createdInvoices.length,
        errorMessage: null,
      };
    } catch (e: any) {
      const msg = e?.message ?? "Batch processing failed";
      await this.batches.setStatus(batch.id, BillingBatchStatus.ERROR, msg);
      throw e;
    }
  }
}
