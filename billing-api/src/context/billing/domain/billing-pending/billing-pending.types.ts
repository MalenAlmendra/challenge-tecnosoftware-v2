import { BillingPendingStatus } from "./billing-pending.enum";

export type ListBillingPendingsInput = {
  customerId?: number;
  serviceDateFrom?: Date;
  serviceDateTo?: Date;
  status?: BillingPendingStatus;
  page?: number;      // 1-based
  pageSize?: number;  // default 20
};

export type BillingPendingListItem = {
  id: number;
  serviceId: number;
  status: BillingPendingStatus;
  createdAt: Date;
  updatedAt: Date;

  // Campos útiles para UI (según README). Si tu repo los trae vía join, mejor:
  customerId?: number;
  serviceDate?: Date;
  amount?: number;
};

export type ListBillingPendingsOutput = {
  items: BillingPendingListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};