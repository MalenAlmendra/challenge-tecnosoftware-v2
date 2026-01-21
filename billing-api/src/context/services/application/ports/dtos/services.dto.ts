import { ServiceStatus } from "@/context/services/domain/services.enum";

export type ServiceDTO = {
  id: number;
  serviceDate: Date;
  customerId: number;
  amount: number;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
};