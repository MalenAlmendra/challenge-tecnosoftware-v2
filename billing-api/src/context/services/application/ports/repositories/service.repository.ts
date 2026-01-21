import { ServiceStatus } from '../../domain/service-status'; // o donde lo tengas

export type ServiceEntity = {
  id: number;
  serviceDate: Date;
  customerId: number;
  amount: number;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface ServiceRepository {
  create(data: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceEntity>;
  findById(id: number): Promise<ServiceEntity | null>;
  list(filters?: {
    customerId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    status?: ServiceStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ServiceEntity[]; total: number }>;
}