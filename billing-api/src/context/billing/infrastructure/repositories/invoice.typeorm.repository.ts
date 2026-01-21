import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InvoiceRepository, InvoiceEntity } from '../../application/ports/repositories/invoice.repository';
import { Invoice } from '../../../../entities/invoice.entity';
import { BillingPending } from '../../../../entities/billing-pending.entity';
import { Service } from '../../../../entities/service.entity';
import { TransactionContext } from '../../../shared/infrastructure/persistence/transaction-context';

@Injectable()
export class TypeOrmInvoiceRepository implements InvoiceRepository {
  private readonly repository: Repository<Invoice>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TransactionContext,
  ) {
    this.repository = this.dataSource.getRepository(Invoice);
  }

  private manager() {
    return this.context.getManager() ?? this.repository.manager;
  }

  async createMany(
    data: Array<Omit<InvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<InvoiceEntity[]> {
    const manager = this.manager();
    const pendingIds = data.map((row) => row.pendingId);

    const amounts = await manager
      .createQueryBuilder(Service, 'service')
      .innerJoin(BillingPending, 'pending', 'pending.serviceId = service.id')
      .where('pending.id IN (:...pendingIds)', { pendingIds })
      .select(['pending.id as pendingId', 'service.amount as amount'])
      .getRawMany<{ pendingId: number; amount: number }>();

    const amountByPending = new Map(
      amounts.map((row) => [Number(row.pendingId), Number(row.amount)]),
    );

    const entities = data.map((row) => ({
      ...row,
      amount:
        row.amount && Number(row.amount) > 0
          ? Number(row.amount)
          : amountByPending.get(row.pendingId) ?? 0,
    }));

    const created = manager.create(Invoice, entities);
    const saved = await manager.save(created);
    return saved.map((invoice) => this.map(invoice));
  }

  async list(filters?: {
    batchId?: number;
    customerId?: number;
    issueDateFrom?: Date;
    issueDateTo?: Date;
    receiptBook?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: InvoiceEntity[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.pending', 'pending')
      .leftJoinAndSelect('pending.service', 'service')
      .leftJoinAndSelect('invoice.batch', 'batch');

    if (filters?.batchId) {
      qb.andWhere('invoice.batchId = :batchId', { batchId: filters.batchId });
    }

    if (filters?.customerId) {
      qb.andWhere('service.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.issueDateFrom) {
      qb.andWhere('invoice.issueDate >= :issueDateFrom', {
        issueDateFrom: filters.issueDateFrom,
      });
    }

    if (filters?.issueDateTo) {
      qb.andWhere('invoice.issueDate <= :issueDateTo', {
        issueDateTo: filters.issueDateTo,
      });
    }

    if (filters?.receiptBook) {
      qb.andWhere('batch.receiptBook = :receiptBook', {
        receiptBook: filters.receiptBook,
      });
    }

    qb.orderBy('invoice.createdAt', 'DESC');

    if (filters?.limit) qb.take(filters.limit);
    if (filters?.offset) qb.skip(filters.offset);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((invoice) => ({
        ...this.map(invoice),
        customerId: invoice.pending?.service?.customerId,
        serviceId: invoice.pending?.service?.id,
        serviceDate: invoice.pending?.service?.serviceDate,
        receiptBook: invoice.batch?.receiptBook,
      })),
      total,
    };
  }

  async listByBatchId(batchId: number): Promise<InvoiceEntity[]> {
    const items = await this.repository.find({
      where: { batchId },
      order: { createdAt: 'ASC' },
    });
    return items.map((invoice) => this.map(invoice));
  }

  async findByPendingId(pendingId: number): Promise<InvoiceEntity | null> {
    const invoice = await this.repository.findOne({ where: { pendingId } });
    return invoice ? this.map(invoice) : null;
  }

  private map(entity: Invoice): InvoiceEntity {
    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      cae: entity.cae,
      issueDate: entity.issueDate,
      amount: Number(entity.amount),
      batchId: entity.batchId,
      pendingId: entity.pendingId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
