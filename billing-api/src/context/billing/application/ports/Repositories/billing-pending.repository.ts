// application/ports/repositories/billing-pending.repository.ts
import { PendingStatus } from '../../domain/pending-status';

export type BillingPendingEntity = {
  id: number;
  serviceId: number;
  status: PendingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface BillingPendingRepository {
  create(data: Omit<BillingPendingEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<BillingPendingEntity>;
  findById(id: number): Promise<BillingPendingEntity | null>;
  findByServiceId(serviceId: number): Promise<BillingPendingEntity | null>;
  list(filters?: {
    customerId?: number;         // puede resolverse via join en infra o vista
    serviceDateFrom?: Date;      // idem
    serviceDateTo?: Date;
    status?: PendingStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: BillingPendingEntity[]; total: number }>;

  /** Para concurrencia: lockear pendings por ids (infra lo implementa con SELECT ... FOR UPDATE) */
  lockByIds(ids: number[]): Promise<BillingPendingEntity[]>;
  markInvoiced(ids: number[]): Promise<void>;
}
