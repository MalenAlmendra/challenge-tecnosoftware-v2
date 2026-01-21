// application/ports/repositories/billing-batch.repository.ts
import { BatchStatus } from '../../domain/batch-status';

export type BillingBatchEntity = {
  id: number;
  issueDate: Date;
  receiptBook: string;
  status: BatchStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface BillingBatchRepository {
  create(data: Omit<BillingBatchEntity, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'errorMessage'>): Promise<BillingBatchEntity>;
  findById(id: number): Promise<BillingBatchEntity | null>;
  setStatus(id: number, status: BatchStatus, errorMessage?: string | null): Promise<void>;
}
