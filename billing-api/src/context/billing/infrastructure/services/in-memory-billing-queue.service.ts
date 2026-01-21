import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BillingQueue, BillingBatchJobPayload } from '../../application/ports/services/billing-queue.port';
import { ProcessBillingBatchJobUseCase } from '../../application/use-cases/billing-batch/ProcessBillingBatchJob.usecase';

@Injectable()
export class InMemoryBillingQueueService implements BillingQueue {
  constructor(private readonly jobUseCase: ProcessBillingBatchJobUseCase) {}

  async enqueueBillingBatch(payload: BillingBatchJobPayload): Promise<{ jobId: string }> {
    const jobId = randomUUID();

    setImmediate(() => {
      void this.jobUseCase.execute({
        batchId: payload.batchId,
        pendingIds: payload.pendingIds,
        correlationId: payload.correlationId,
      });
    });

    return { jobId };
  }
}
