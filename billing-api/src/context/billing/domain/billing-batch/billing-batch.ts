import { BillingBatchStatus } from "./billing-batch.enum";

export class BillingBatch {
  billingBatchId: number;
  issueDate: Date;
  receiptBook: string;
  billingBatchStatus: BillingBatchStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
