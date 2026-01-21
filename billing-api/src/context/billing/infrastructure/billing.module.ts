import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingPending, BillingBatch, Invoice, Service, InvoiceNumberSequence } from '../../../entities';
import { BillingPendingsController } from './controllers/billing-pendings.controller';
import { BillingBatchesController } from './controllers/billing-batches.controller';
import { BillingInvoicesController } from './controllers/billing-invoices.controller';
import { TypeOrmBillingPendingRepository } from './repositories/billing-pending.typeorm.repository';
import { TypeOrmBillingBatchRepository } from './repositories/billing-batch.typeorm.repository';
import { TypeOrmInvoiceRepository } from './repositories/invoice.typeorm.repository';
import { TypeOrmTransactionManager } from './services/typeorm-transaction.manager';
import { TypeOrmInvoiceNumberingService } from './services/typeorm-invoice-numbering.service';
import { MockCaeGeneratorService } from './services/mock-cae-generator.service';
import { InMemoryBillingQueueService } from './services/in-memory-billing-queue.service';
import { ListBillingPendingsUseCase } from '../application/use-cases/billing-pending/ListBillingPendings.usecase';
import { CreateBillingBatchUseCase } from '../application/use-cases/billing-batch/CreateBillingBatch.usecase';
import { ProcessBillingBatchUseCase } from '../application/use-cases/billing-batch/ProcessBillingBatch.usecase';
import { GetBillingBatchResultUseCase } from '../application/use-cases/billing-batch/GetBillingBatchResult.usecase';
import { ListInvoicesUseCase } from '../application/use-cases/invoice/ListInvoices.usecase';
import { EnqueueBillingBatchUseCase } from '../application/use-cases/billing-batch/EnqueueBillingBatch.usecase';
import { ProcessBillingBatchJobUseCase } from '../application/use-cases/billing-batch/ProcessBillingBatchJob.usecase';
import {
  BILLING_BATCH_REPOSITORY,
  BILLING_PENDING_REPOSITORY,
  BILLING_QUEUE,
  CAE_GENERATOR,
  INVOICE_NUMBERING,
  INVOICE_REPOSITORY,
  TRANSACTION_MANAGER,
} from './billing.tokens';
import { TransactionContext } from '../../shared/infrastructure/persistence/transaction-context';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillingPending,
      BillingBatch,
      Invoice,
      Service,
      InvoiceNumberSequence,
    ]),
  ],
  controllers: [
    BillingPendingsController,
    BillingBatchesController,
    BillingInvoicesController,
  ],
  providers: [
    TransactionContext,
    {
      provide: BILLING_PENDING_REPOSITORY,
      useClass: TypeOrmBillingPendingRepository,
    },
    {
      provide: BILLING_BATCH_REPOSITORY,
      useClass: TypeOrmBillingBatchRepository,
    },
    {
      provide: INVOICE_REPOSITORY,
      useClass: TypeOrmInvoiceRepository,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManager,
    },
    {
      provide: INVOICE_NUMBERING,
      useClass: TypeOrmInvoiceNumberingService,
    },
    {
      provide: CAE_GENERATOR,
      useClass: MockCaeGeneratorService,
    },
    {
      provide: BILLING_QUEUE,
      useClass: InMemoryBillingQueueService,
    },
    {
      provide: ListBillingPendingsUseCase,
      useFactory: (pendings) => new ListBillingPendingsUseCase(pendings),
      inject: [BILLING_PENDING_REPOSITORY],
    },
    {
      provide: CreateBillingBatchUseCase,
      useFactory: (batches) => new CreateBillingBatchUseCase(batches),
      inject: [BILLING_BATCH_REPOSITORY],
    },
    {
      provide: ProcessBillingBatchUseCase,
      useFactory: (tx, batches, pendings, invoices, numbering, cae) =>
        new ProcessBillingBatchUseCase(tx, batches, pendings, invoices, numbering, cae),
      inject: [
        TRANSACTION_MANAGER,
        BILLING_BATCH_REPOSITORY,
        BILLING_PENDING_REPOSITORY,
        INVOICE_REPOSITORY,
        INVOICE_NUMBERING,
        CAE_GENERATOR,
      ],
    },
    {
      provide: GetBillingBatchResultUseCase,
      useFactory: (batches, invoices) => new GetBillingBatchResultUseCase(batches, invoices),
      inject: [BILLING_BATCH_REPOSITORY, INVOICE_REPOSITORY],
    },
    {
      provide: ListInvoicesUseCase,
      useFactory: (invoices) => new ListInvoicesUseCase(invoices),
      inject: [INVOICE_REPOSITORY],
    },
    {
      provide: ProcessBillingBatchJobUseCase,
      useFactory: (tx, batches, pendings, invoices, numbering, cae) =>
        new ProcessBillingBatchJobUseCase(tx, batches, pendings, invoices, numbering, cae),
      inject: [
        TRANSACTION_MANAGER,
        BILLING_BATCH_REPOSITORY,
        BILLING_PENDING_REPOSITORY,
        INVOICE_REPOSITORY,
        INVOICE_NUMBERING,
        CAE_GENERATOR,
      ],
    },
    {
      provide: EnqueueBillingBatchUseCase,
      useFactory: (batches, queue) => new EnqueueBillingBatchUseCase(batches, queue),
      inject: [BILLING_BATCH_REPOSITORY, BILLING_QUEUE],
    },
  ],
  exports: [
    BILLING_BATCH_REPOSITORY,
    BILLING_PENDING_REPOSITORY,
    INVOICE_REPOSITORY,
  ],
})
export class BillingModule {}
