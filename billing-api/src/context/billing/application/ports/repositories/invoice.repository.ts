// application/ports/repositories/invoice.repository.ts
export type InvoiceEntity = {
  id: number;
  invoiceNumber: string;
  cae: string;
  issueDate: Date;
  amount: number;
  batchId: number;
  pendingId: number; // UNIQUE => un pending, una invoice
  createdAt: Date;
  updatedAt: Date;
};

export interface InvoiceRepository {
  createMany(data: Array<Omit<InvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<InvoiceEntity[]>;
  list(filters?: {
    batchId?: number;
    customerId?: number;      // si necesitas joins, se resuelve en infra
    issueDateFrom?: Date;
    issueDateTo?: Date;
    receiptBook?: string;     // si lo guardas en invoice o via join batch
    limit?: number;
    offset?: number;
  }): Promise<{ items: InvoiceEntity[]; total: number }>;
  listByBatchId(batchId: number): Promise<InvoiceEntity[]>;
  findByPendingId(pendingId: number): Promise<InvoiceEntity | null>;
}
