// application/ports/repositories/billing-batch.repository.ts
import { BillingBatchStatus } from '../../domain/billing-batch/billing-batch.enum';

export type BillingBatchEntity = {
  id: number;
  issueDate: Date;
  receiptBook: string;
  status: BillingBatchStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface BillingBatchRepository {
  create(data: Omit<BillingBatchEntity, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'errorMessage'>): Promise<BillingBatchEntity>;
  findById(id: number): Promise<BillingBatchEntity | null>;
  setStatus(id: number, status: BillingBatchStatus, errorMessage?: string | null): Promise<void>;
}
