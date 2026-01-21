// application/use-cases/billing-pendings/create-billing-pending.usecase.ts
import { BillingPendingRepository } from "../../ports/repositories/billing-pending.repository";
import { ServiceRepository } from "../../../../services/application/ports/repositories/service.repository";
import { Errors } from "../../../../shared/application/errors/errors";
import { BillingPendingStatus } from "../../../domain/billing-pending/billing-pending.enum";
import { ServiceStatus } from "../../../../services/domain/services.enum";

export type CreateBillingPendingInput = { serviceId: number };
export type CreateBillingPendingOutput = {
  id: number;
  serviceId: number;
  status: BillingPendingStatus;
};

export class CreateBillingPendingUseCase {
  constructor(
    private readonly services: ServiceRepository,
    private readonly pendings: BillingPendingRepository,
  ) {}

  async execute(
    input: CreateBillingPendingInput,
  ): Promise<CreateBillingPendingOutput> {
    if (!input.serviceId) throw Errors.Validation("serviceId is required");

    const service = await this.services.findById(input.serviceId);
    if (!service)
      throw Errors.NotFound("Service", { serviceId: input.serviceId });

    if (service.status === ServiceStatus.CANCELLED) {
      throw Errors.Validation("Cancelled services cannot be sent to billing", {
        serviceId: input.serviceId,
      });
    }

    const existing = await this.pendings.findByServiceId(input.serviceId);
    if (existing)
      throw Errors.Conflict("Service already has a billing pending", {
        serviceId: input.serviceId,
      });

    const pending = await this.pendings.create({
      serviceId: input.serviceId,
      status: BillingPendingStatus.PENDING,
    });

    return {
      id: pending.id,
      serviceId: pending.serviceId,
      status: pending.status,
    };
  }
}
