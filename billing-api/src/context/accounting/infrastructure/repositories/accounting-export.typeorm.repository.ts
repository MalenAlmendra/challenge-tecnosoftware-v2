import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  AccountingExportRepository,
  AccountingExportRecord,
  ExportStatus,
} from '../../application/port/repositories/accounting-export.repository';
import { AccountingExport, AccountingExportStatus } from '../../../../entities/accounting-export.entity';
import { TransactionContext } from '../../../shared/infrastructure/persistence/transaction-context';

@Injectable()
export class TypeOrmAccountingExportRepository implements AccountingExportRepository {
  private readonly repository: Repository<AccountingExport>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TransactionContext,
  ) {
    this.repository = this.dataSource.getRepository(AccountingExport);
  }

  private manager() {
    return this.context.getManager() ?? this.repository.manager;
  }

  async findByBatchId(batchId: number): Promise<AccountingExportRecord | null> {
    const record = await this.repository.findOne({ where: { batchId } });
    return record ? this.map(record) : null;
  }

  async create(data: {
    batchId: number;
    status: ExportStatus;
    payload: unknown;
  }): Promise<AccountingExportRecord> {
    const manager = this.manager();
    const created = manager.create(AccountingExport, {
      batchId: data.batchId,
      status: data.status as AccountingExportStatus,
      payload: data.payload,
      externalRequestId: null,
      errorMessage: null,
      sentAt: null,
    });
    const saved = await manager.save(created);
    return this.map(saved);
  }

  async markSent(params: {
    id: number;
    externalRequestId: string;
    sentAt: Date;
  }): Promise<void> {
    const manager = this.manager();
    await manager.update(
      AccountingExport,
      { id: params.id },
      {
        status: AccountingExportStatus.SENT,
        externalRequestId: params.externalRequestId,
        sentAt: params.sentAt,
        errorMessage: null,
      },
    );
  }

  async markError(params: { id: number; errorMessage: string }): Promise<void> {
    const manager = this.manager();
    await manager.update(
      AccountingExport,
      { id: params.id },
      {
        status: AccountingExportStatus.ERROR,
        errorMessage: params.errorMessage,
      },
    );
  }

  private map(entity: AccountingExport): AccountingExportRecord {
    return {
      id: entity.id,
      batchId: entity.batchId,
      status: entity.status as ExportStatus,
      payload: entity.payload,
      externalRequestId: entity.externalRequestId,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      sentAt: entity.sentAt,
    };
  }
}
