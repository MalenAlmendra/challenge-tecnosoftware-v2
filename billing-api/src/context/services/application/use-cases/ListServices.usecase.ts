import { ServiceRepository } from "../ports/repositories/service.repository";
import { ServiceDTO } from "../ports/dtos/services.dto";
import { Errors } from "../../../shared/application/errors/errors";
import { ServiceStatus } from "../../domain/services.enum";

export type ListServicesInput = {
  customerId?: number;
  serviceDateFrom?: Date;
  serviceDateTo?: Date;
  status?: ServiceStatus;

  page?: number;
  pageSize?: number;
};

export type ServiceListItem = Pick<
  ServiceDTO,
  | "id"
  | "serviceDate"
  | "customerId"
  | "amount"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export type ListServicesOutput = {
  items: ServiceListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export class ListServicesUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(input: ListServicesInput = {}): Promise<ListServicesOutput> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize =
      input.pageSize && input.pageSize > 0 && input.pageSize <= 200
        ? input.pageSize
        : 20;

    if (input.customerId != null && input.customerId <= 0) {
      throw Errors.Validation("customerId must be a positive number");
    }

    if (
      input.serviceDateFrom &&
      input.serviceDateTo &&
      input.serviceDateFrom > input.serviceDateTo
    ) {
      throw Errors.Validation("serviceDateFrom must be <= serviceDateTo");
    }

    const offset = (page - 1) * pageSize;

    const { items, total } = await this.services.list({
      customerId: input.customerId,
      dateFrom: input.serviceDateFrom,
      dateTo: input.serviceDateTo,
      status: input.status,
      limit: pageSize,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: items.map((s) => ({
        id: s.id,
        serviceDate: s.serviceDate,
        customerId: s.customerId,
        amount: s.amount,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
