// src/billing/application/use-cases/billing-batches/enqueue-billing-batch.usecase.ts

import { BillingBatchRepository } from '../../ports/repositories/billing-batch.repository';
import { BillingQueue } from '../../ports/services/billing-queue.port';
import { Errors } from '../../../../shared/application/errors/errors';
import { BillingBatchStatus } from '../../../domain/billing-batch/billing-batch.enum';

export type EnqueueBillingBatchInput = {
  batchId: number;
  pendingIds: number[];
  correlationId?: string;
};

export type EnqueueBillingBatchOutput = {
  batchId: number;
  status: BillingBatchStatus;
  jobId: string;
};

export class EnqueueBillingBatchUseCase {
  constructor(
    private readonly batches: BillingBatchRepository,
    private readonly queue: BillingQueue,
  ) {}

  async execute(input: EnqueueBillingBatchInput): Promise<EnqueueBillingBatchOutput> {
    if (!input.batchId) throw Errors.Validation('batchId is required');
    if (!Array.isArray(input.pendingIds) || input.pendingIds.length === 0) {
      throw Errors.Validation('pendingIds must be a non-empty array');
    }

    const batch = await this.batches.findById(input.batchId);
    if (!batch) throw Errors.NotFound('BillingBatch', { batchId: input.batchId });

    // ✅ Idempotencia: si ya se procesó, no vuelvas a encolar
    if (batch.status === BillingBatchStatus.PROCESSED) {
      throw Errors.Conflict('Batch already processed', { batchId: batch.id });
    }

    // ✅ Si ya está encolado/en proceso, evitá duplicados
    // (solo si tu enum tiene estos estados; si no, eliminá esta validación)
    if ((BillingBatchStatus as any).PENDING_PROCESSING && batch.status === (BillingBatchStatus as any).PENDING_PROCESSING) {
      throw Errors.Conflict('Batch already queued', { batchId: batch.id });
    }
    if ((BillingBatchStatus as any).IN_PROGRESS && batch.status === (BillingBatchStatus as any).IN_PROGRESS) {
      throw Errors.Conflict('Batch is already being processed', { batchId: batch.id });
    }

    // 1) setear estado "pendiente de procesamiento" (si existe)
    if ((BillingBatchStatus as any).PENDING_PROCESSING) {
      await this.batches.setStatus(batch.id, (BillingBatchStatus as any).PENDING_PROCESSING, null);
    }

    // 2) encolar job
    const { jobId } = await this.queue.enqueueBillingBatch({
      batchId: batch.id,
      pendingIds: input.pendingIds,
      correlationId: input.correlationId,
    });

    return {
      batchId: batch.id,
      status: ((BillingBatchStatus as any).PENDING_PROCESSING ?? batch.status) as BillingBatchStatus,
      jobId,
    };
  }
}
