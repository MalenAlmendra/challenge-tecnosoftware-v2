import { ServiceRepository } from "../ports/repositories/service.repository";
import { Errors } from "../../../shared/application/errors/errors";
import { ServiceStatus } from "../../domain/services.enum";

export type CreateServiceInput = {
  serviceDate: Date;
  customerId: number;
  amount: number;
};

export type CreateServiceOutput = {
  id: number;
  serviceDate: Date;
  customerId: number;
  amount: number;
  status: ServiceStatus;
};

export class CreateServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(input: CreateServiceInput): Promise<CreateServiceOutput> {
    if (!input.customerId) throw Errors.Validation("customerId is required");
    if (!input.serviceDate) throw Errors.Validation("serviceDate is required");
    if (input.amount == null || Number(input.amount) <= 0) {
      throw Errors.Validation("amount must be > 0");
    }

    const created = await this.services.create({
      serviceDate: input.serviceDate,
      customerId: input.customerId,
      amount: input.amount,
      status: ServiceStatus.PENDING,
    });

    return {
      id: created.id,
      serviceDate: created.serviceDate,
      customerId: created.customerId,
      amount: created.amount,
      status: created.status,
    };
  }
}
