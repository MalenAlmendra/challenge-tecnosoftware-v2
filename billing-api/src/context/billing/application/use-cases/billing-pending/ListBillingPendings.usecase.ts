import { BillingPendingRepository } from '../../ports/repositories/billing-pending.repository';
import { Errors } from '../../../../shared/application/errors/errors';
import { ListBillingPendingsInput, ListBillingPendingsOutput } from '@/context/billing/domain/billing-pending/billing-pending.types';


export class ListBillingPendingsUseCase {
  constructor(private readonly pendings: BillingPendingRepository) {}

  async execute(input: ListBillingPendingsInput): Promise<ListBillingPendingsOutput> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize =
      input.pageSize && input.pageSize > 0 && input.pageSize <= 200 ? input.pageSize : 20;

    if (input.customerId != null && input.customerId <= 0) {
      throw Errors.Validation('customerId must be a positive number');
    }

    if (input.serviceDateFrom && input.serviceDateTo) {
      if (input.serviceDateFrom > input.serviceDateTo) {
        throw Errors.Validation('serviceDateFrom must be <= serviceDateTo');
      }
    }

    const offset = (page - 1) * pageSize;

    const { items, total } = await this.pendings.list({
      customerId: input.customerId,
      serviceDateFrom: input.serviceDateFrom,
      serviceDateTo: input.serviceDateTo,
      status: input.status,
      limit: pageSize,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: items.map((p: any) => ({
        id: p.id,
        serviceId: p.serviceId,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,

        // Si tu implementación del repo hace join con Service, podés devolver estos extras.
        customerId: p.customerId,
        serviceDate: p.serviceDate,
        amount: p.amount,
      })),
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
