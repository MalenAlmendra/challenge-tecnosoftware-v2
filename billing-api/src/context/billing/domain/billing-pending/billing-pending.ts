import { BillingPendingStatus } from "./billing-pending.enum";

export class BillingPending {
  billingPendingId: number;
  serviceId: number;
  status: BillingPendingStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    billingPendingId: number,
    serviceId: number,
    status: BillingPendingStatus,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.billingPendingId = billingPendingId;
    this.serviceId = serviceId;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
