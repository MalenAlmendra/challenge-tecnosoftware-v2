// src/billing/application/use-cases/invoices/list-invoices.usecase.ts

import {
  InvoiceRepository,
  InvoiceEntity,
} from "../../ports/repositories/invoice.repository";
import { Errors } from "../../../../shared/application/errors/errors";

export type ListInvoicesInput = {
  batchId?: number;
  customerId?: number; // requiere join: invoices -> pendings -> services
  receiptBook?: string; // requiere join: invoices -> batches
  issueDateFrom?: Date;
  issueDateTo?: Date;

  page?: number; // 1-based
  pageSize?: number; // default 20
};

export type InvoiceListItem = Pick<
  InvoiceEntity,
  | "id"
  | "invoiceNumber"
  | "cae"
  | "issueDate"
  | "amount"
  | "batchId"
  | "pendingId"
  | "createdAt"
  | "updatedAt"
> & {
  // opcionales si el repo los trae por join (ideal para UI)
  customerId?: number;
  serviceId?: number;
  serviceDate?: Date;
  receiptBook?: string;
};

export type ListInvoicesOutput = {
  items: InvoiceListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export class ListInvoicesUseCase {
  constructor(private readonly invoices: InvoiceRepository) {}

  async execute(input: ListInvoicesInput = {}): Promise<ListInvoicesOutput> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize =
      input.pageSize && input.pageSize > 0 && input.pageSize <= 200
        ? input.pageSize
        : 20;

    if (input.batchId != null && input.batchId <= 0) {
      throw Errors.Validation("batchId must be a positive number");
    }

    if (input.customerId != null && input.customerId <= 0) {
      throw Errors.Validation("customerId must be a positive number");
    }

    if (input.receiptBook != null && !input.receiptBook.trim()) {
      throw Errors.Validation("receiptBook cannot be empty");
    }

    if (
      input.issueDateFrom &&
      input.issueDateTo &&
      input.issueDateFrom > input.issueDateTo
    ) {
      throw Errors.Validation("issueDateFrom must be <= issueDateTo");
    }

    const offset = (page - 1) * pageSize;

    const { items, total } = await this.invoices.list({
      batchId: input.batchId,
      customerId: input.customerId,
      receiptBook: input.receiptBook?.trim(),
      issueDateFrom: input.issueDateFrom,
      issueDateTo: input.issueDateTo,
      limit: pageSize,
      offset,
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: items.map((i: any) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        cae: i.cae,
        issueDate: i.issueDate,
        amount: i.amount,
        batchId: i.batchId,
        pendingId: i.pendingId,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,

        // extras si el repo los incluyó por join:
        customerId: i.customerId,
        serviceId: i.serviceId,
        serviceDate: i.serviceDate,
        receiptBook: i.receiptBook,
      })),
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
