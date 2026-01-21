import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BillingPendingRepository, BillingPendingEntity } from '../../application/ports/repositories/billing-pending.repository';
import { BillingPendingStatus } from '../../domain/billing-pending/billing-pending.enum';
import { BillingPending } from '../../../../entities/billing-pending.entity';
import { TransactionContext } from '../../../shared/infrastructure/persistence/transaction-context';

@Injectable()
export class TypeOrmBillingPendingRepository implements BillingPendingRepository {
  private readonly repository: Repository<BillingPending>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TransactionContext,
  ) {
    this.repository = this.dataSource.getRepository(BillingPending);
  }

  private manager() {
    return this.context.getManager() ?? this.repository.manager;
  }

  async create(
    data: Omit<BillingPendingEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<BillingPendingEntity> {
    const manager = this.manager();
    const entity = manager.create(BillingPending, {
      serviceId: data.serviceId,
      status: data.status,
    });
    const saved = await manager.save(entity);
    return this.map(saved);
  }

  async findById(id: number): Promise<BillingPendingEntity | null> {
    const pending = await this.repository.findOne({ where: { id } });
    return pending ? this.map(pending) : null;
  }

  async findByServiceId(serviceId: number): Promise<BillingPendingEntity | null> {
    const pending = await this.repository.findOne({ where: { serviceId } });
    return pending ? this.map(pending) : null;
  }

  async list(filters?: {
    customerId?: number;
    serviceDateFrom?: Date;
    serviceDateTo?: Date;
    status?: BillingPendingStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: BillingPendingEntity[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder('pending')
      .leftJoinAndSelect('pending.service', 'service');

    if (filters?.customerId) {
      qb.andWhere('service.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.serviceDateFrom) {
      qb.andWhere('service.serviceDate >= :serviceDateFrom', {
        serviceDateFrom: filters.serviceDateFrom,
      });
    }

    if (filters?.serviceDateTo) {
      qb.andWhere('service.serviceDate <= :serviceDateTo', {
        serviceDateTo: filters.serviceDateTo,
      });
    }

    if (filters?.status) {
      qb.andWhere('pending.status = :status', { status: filters.status });
    }

    qb.orderBy('pending.createdAt', 'DESC');

    if (filters?.limit) qb.take(filters.limit);
    if (filters?.offset) qb.skip(filters.offset);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((pending) => ({
        ...this.map(pending),
        customerId: pending.service?.customerId,
        serviceDate: pending.service?.serviceDate,
        amount: pending.service?.amount,
      })),
      total,
    };
  }

  async lockByIds(ids: number[]): Promise<BillingPendingEntity[]> {
    const manager = this.manager();
    const items = await manager
      .createQueryBuilder(BillingPending, 'pending')
      .setLock('pessimistic_write')
      .where('pending.id IN (:...ids)', { ids })
      .getMany();

    return items.map((pending) => this.map(pending));
  }

  async markInvoiced(ids: number[]): Promise<void> {
    const manager = this.manager();
    await manager
      .createQueryBuilder()
      .update(BillingPending)
      .set({ status: BillingPendingStatus.INVOICED })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  private map(entity: BillingPending): BillingPendingEntity {
    return {
      id: entity.id,
      serviceId: entity.serviceId,
      status: entity.status as BillingPendingStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
