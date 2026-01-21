export type BillingBatchJobPayload = {
  batchId: number;
  pendingIds: number[];
  correlationId?: string;
};

export interface BillingQueue {
  enqueueBillingBatch(payload: BillingBatchJobPayload): Promise<{ jobId: string }>;
}