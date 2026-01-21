// src/billing/application/use-cases/accounting/send-accounting-export.usecase.ts

import { Errors } from '../../../shared/application/errors/errors';
import { BillingBatchRepository } from '../../../billing/application/ports/Repositories/billing-batch.repository';
import {
  AccountingExportRepository,
  ExportStatus,
} from '../port/repositories/accounting-export.repository';
import { AccountingErpClient } from '../port/services/accounting-erp-client.port';
import { PrepareAccountingExportUseCase } from '../use-cases/PrepareAccountingExport.usecase';
import { BillingBatchStatus } from '../../../billing/domain/billing-batch/billing-batch.enum';

export type SendAccountingExportInput = {
  batchId: number;
};

export type SendAccountingExportOutput = {
  batchId: number;
  exportId: number;
  status: ExportStatus;
  externalRequestId?: string | null;
  sentAt?: string | null;
  errorMessage?: string | null;
};

export class SendAccountingExportUseCase {
  constructor(
    private readonly batches: BillingBatchRepository,
    private readonly exportsRepo: AccountingExportRepository,
    private readonly prepare: PrepareAccountingExportUseCase,
    private readonly erp: AccountingErpClient,
  ) {}

  async execute(input: SendAccountingExportInput): Promise<SendAccountingExportOutput> {
    if (!input.batchId) throw Errors.Validation('batchId is required');

    const batch = await this.batches.findById(input.batchId);
    if (!batch) throw Errors.NotFound('BillingBatch', { batchId: input.batchId });

    if (batch.status !== BillingBatchStatus.PROCESSED) {
      throw Errors.Conflict('Batch is not processed, cannot send to ERP', {
        batchId: batch.id,
        status: batch.status,
      });
    }

    // ✅ Idempotencia: si ya se envió, devolvemos lo mismo (no reenviamos)
    const existing = await this.exportsRepo.findByBatchId(batch.id);
    if (existing && existing.status === ExportStatus.SENT) {
      return {
        batchId: batch.id,
        exportId: existing.id,
        status: existing.status,
        externalRequestId: existing.externalRequestId,
        sentAt: existing.sentAt ? existing.sentAt.toISOString() : null,
        errorMessage: existing.errorMessage,
      };
    }

    // Si hubo ERROR antes, podés permitir reintento
    // (esto suma puntos: retry manual)
    const payload = await this.prepare.execute({ batchId: batch.id });

    // Si no existe record, lo creamos en PENDING con el payload (outbox)
    const record =
      existing ??
      (await this.exportsRepo.create({
        batchId: batch.id,
        status: ExportStatus.PENDING,
        payload,
      }));

    try {
      const result = await this.erp.send(payload);

      await this.exportsRepo.markSent({
        id: record.id,
        externalRequestId: result.externalRequestId,
        sentAt: new Date(result.sentAt),
      });

      return {
        batchId: batch.id,
        exportId: record.id,
        status: ExportStatus.SENT,
        externalRequestId: result.externalRequestId,
        sentAt: result.sentAt,
        errorMessage: null,
      };
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to send export to ERP';

      await this.exportsRepo.markError({
        id: record.id,
        errorMessage: msg,
      });

      // Re-lanzamos para que el controller/worker lo maneje
      throw Errors.Internal('ERP send simulation failed', { batchId: batch.id, reason: msg });
    }
  }
}
