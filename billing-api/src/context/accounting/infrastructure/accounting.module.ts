import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingExport } from '../../../entities/accounting-export.entity';
import { BillingModule } from '../../billing/infrastructure/billing.module';
import { AccountingExportsController } from './controllers/accounting-exports.controller';
import { TypeOrmAccountingExportRepository } from './repositories/accounting-export.typeorm.repository';
import { MockAccountingErpClient } from './services/mock-accounting-erp.client';
import { PrepareAccountingExportUseCase } from '../application/use-cases/PrepareAccountingExport.usecase';
import { SendAccountingExportUseCase } from '../application/use-cases/SendAccountingExport.usecase';
import { ACCOUNTING_EXPORT_REPOSITORY, ACCOUNTING_ERP_CLIENT } from './accounting.tokens';
import {
  BILLING_BATCH_REPOSITORY,
  INVOICE_REPOSITORY,
} from '../../billing/infrastructure/billing.tokens';
import { TransactionContext } from '../../shared/infrastructure/persistence/transaction-context';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingExport]), BillingModule],
  controllers: [AccountingExportsController],
  providers: [
    TransactionContext,
    {
      provide: ACCOUNTING_EXPORT_REPOSITORY,
      useClass: TypeOrmAccountingExportRepository,
    },
    {
      provide: ACCOUNTING_ERP_CLIENT,
      useClass: MockAccountingErpClient,
    },
    {
      provide: PrepareAccountingExportUseCase,
      useFactory: (batches, invoices) =>
        new PrepareAccountingExportUseCase(batches, invoices),
      inject: [BILLING_BATCH_REPOSITORY, INVOICE_REPOSITORY],
    },
    {
      provide: SendAccountingExportUseCase,
      useFactory: (batches, exportsRepo, prepare, erp) =>
        new SendAccountingExportUseCase(batches, exportsRepo, prepare, erp),
      inject: [
        BILLING_BATCH_REPOSITORY,
        ACCOUNTING_EXPORT_REPOSITORY,
        PrepareAccountingExportUseCase,
        ACCOUNTING_ERP_CLIENT,
      ],
    },
  ],
})
export class AccountingModule {}
