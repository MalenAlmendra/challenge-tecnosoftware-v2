import { ServiceStatus } from "./services.enum";

export class Services {
  servicesId: number;
  serviceDate: Date;
  customerId: number;
  amount: number;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    servicesId: number,
    serviceDate: Date,
    customerId: number,
    amount: number,
    status: ServiceStatus,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.servicesId = servicesId;
    this.serviceDate = serviceDate;
    this.customerId = customerId;
    this.amount = amount;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
