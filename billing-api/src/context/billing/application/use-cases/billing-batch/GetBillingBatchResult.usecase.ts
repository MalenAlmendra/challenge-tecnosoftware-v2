// application/use-cases/billing-batches/get-billing-batch-result.usecase.ts
import { BillingBatchRepository } from '../../ports/repositories/billing-batch.repository';
import { InvoiceRepository } from '../../ports/repositories/invoice.repository';
import { Errors } from '../../../../shared/application/errors/errors';

export class GetBillingBatchResultUseCase {
  constructor(
    private readonly batches: BillingBatchRepository,
    private readonly invoices: InvoiceRepository,
  ) {}

  async execute(batchId: number) {
    const batch = await this.batches.findById(batchId);
    if (!batch) throw Errors.NotFound('BillingBatch', { batchId });

    const invoices = await this.invoices.listByBatchId(batchId);

    return {
      batch: {
        id: batch.id,
        issueDate: batch.issueDate,
        receiptBook: batch.receiptBook,
        status: batch.status,
        errorMessage: batch.errorMessage,
      },
      invoices: invoices.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        cae: i.cae,
        issueDate: i.issueDate,
        amount: i.amount,
        pendingId: i.pendingId,
      })),
    };
  }
}
