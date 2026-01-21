// application/use-cases/billing-batches/create-billing-batch.usecase.ts
import { BillingBatchRepository } from '../../ports/repositories/billing-batch.repository';
import { Errors } from '../../../../shared/application/errors/errors';

export type CreateBillingBatchInput = {
  issueDate: Date;
  receiptBook: string;
  pendingIds: number[];
};

export type CreateBillingBatchOutput = {
  id: number;
  issueDate: Date;
  receiptBook: string;
};

export class CreateBillingBatchUseCase {
  constructor(private readonly batches: BillingBatchRepository) {}

  async execute(input: CreateBillingBatchInput): Promise<CreateBillingBatchOutput> {
    if (!input.issueDate) throw Errors.Validation('issueDate is required');
    if (!input.receiptBook?.trim()) throw Errors.Validation('receiptBook is required');
    if (!Array.isArray(input.pendingIds) || input.pendingIds.length === 0) {
      throw Errors.Validation('pendingIds must be a non-empty array');
    }

    const batch = await this.batches.create({
      issueDate: input.issueDate,
      receiptBook: input.receiptBook.trim(),
    });

    return { id: batch.id, issueDate: batch.issueDate, receiptBook: batch.receiptBook };
  }
}
