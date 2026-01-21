import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BillingBatchRepository, BillingBatchEntity } from '../../application/ports/repositories/billing-batch.repository';
import { BillingBatch } from '../../../../entities/billing-batch.entity';
import { BillingBatchStatus } from '../../domain/billing-batch/billing-batch.enum';
import { TransactionContext } from '../../../shared/infrastructure/persistence/transaction-context';

@Injectable()
export class TypeOrmBillingBatchRepository implements BillingBatchRepository {
  private readonly repository: Repository<BillingBatch>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TransactionContext,
  ) {
    this.repository = this.dataSource.getRepository(BillingBatch);
  }

  private manager() {
    return this.context.getManager() ?? this.repository.manager;
  }

  async create(
    data: Omit<BillingBatchEntity, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'errorMessage'>,
  ): Promise<BillingBatchEntity> {
    const manager = this.manager();
    const created = manager.create(BillingBatch, {
      issueDate: data.issueDate,
      receiptBook: data.receiptBook,
      status: BillingBatchStatus.PROCESSED,
      errorMessage: null,
    });

    const saved = await manager.save(created);
    return this.map(saved);
  }

  async findById(id: number): Promise<BillingBatchEntity | null> {
    const batch = await this.repository.findOne({ where: { id } });
    return batch ? this.map(batch) : null;
  }

  async setStatus(id: number, status: BillingBatchStatus, errorMessage?: string | null): Promise<void> {
    const manager = this.manager();
    await manager.update(BillingBatch, { id }, { status, errorMessage: errorMessage ?? null });
  }

  private map(entity: BillingBatch): BillingBatchEntity {
    return {
      id: entity.id,
      issueDate: entity.issueDate,
      receiptBook: entity.receiptBook,
      status: entity.status as BillingBatchStatus,
      errorMessage: entity.errorMessage ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
