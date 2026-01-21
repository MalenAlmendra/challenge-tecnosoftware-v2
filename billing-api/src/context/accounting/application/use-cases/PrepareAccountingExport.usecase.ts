// src/billing/application/use-cases/accounting/prepare-accounting-export.usecase.ts

import { BillingBatchRepository } from '../../../billing/application/ports/Repositories/billing-batch.repository';
import { InvoiceRepository } from '../../../billing/application/ports/Repositories/invoice.repository';
import { Errors } from '../../../shared/application/errors/errors';
import { BillingBatchStatus } from '../../../billing/domain/billing-batch/billing-batch.enum';

export type PrepareAccountingExportInput = {
  batchId: number;
};

export type AccountingExportDTO = {
  exportVersion: '1.0';
  generatedAt: string; // ISO
  batch: {
    id: number;
    issueDate: string;    // YYYY-MM-DD
    receiptBook: string;
    status: BillingBatchStatus;
  };
  documents: Array<{
    externalRef: string; // referencia idempotente para el ERP (ej: "BATCH-10-INVOICE-55")
    docType: 'INVOICE';
    invoiceNumber: string;
    cae: string;
    issueDate: string; // YYYY-MM-DD
    customer: {
      id: number;
    };
    totals: {
      currency: 'ARS';
      netAmount: number;
      taxAmount: number;   // en challenge puede ser 0 si no modelás IVA
      totalAmount: number;
    };
    items: Array<{
      lineNumber: number;
      description: string;
      quantity: number;
      unitPrice: number;
      netAmount: number;
      references: {
        serviceId: number;
        serviceDate: string; // YYYY-MM-DD
        pendingId: number;
      };
    }>;
  }>;
};

type InvoiceExportRow = {
  // Invoice
  id: number;
  invoiceNumber: string;
  cae: string;
  issueDate: Date;
  amount: number;
  batchId: number;
  pendingId: number;

  // Enriquecido por joins (lo ideal)
  customerId: number;
  serviceId: number;
  serviceDate: Date;

  // opcional (si tu repo lo trae)
  receiptBook?: string;
};

export class PrepareAccountingExportUseCase {
  constructor(
    private readonly batches: BillingBatchRepository,
    private readonly invoices: InvoiceRepository,
  ) {}

  async execute(input: PrepareAccountingExportInput): Promise<AccountingExportDTO> {
    if (!input.batchId) throw Errors.Validation('batchId is required');

    const batch = await this.batches.findById(input.batchId);
    if (!batch) throw Errors.NotFound('BillingBatch', { batchId: input.batchId });

    // Regla razonable: solo exportar lotes procesados
    if (batch.status !== BillingBatchStatus.PROCESSED) {
      throw Errors.Conflict('Batch is not processed, cannot export', {
        batchId: batch.id,
        status: batch.status,
      });
    }

    /**
     * IMPORTANTE:
     * Para export necesitás customerId/serviceDate/serviceId.
     * Eso NO está en Invoice. Por eso el repo debe hacer joins:
     * invoices -> billing_pendings -> services
     * invoices -> billing_batches (si querés receiptBook desde DB)
     *
     * Podés implementarlo en infra como un método especial:
     *   invoices.listForExport(batchId)
     *
     * Acá lo llamo a través de list() esperando extras (any),
     * pero idealmente agregá un método dedicado en el port.
     */
    const { items } = await this.invoices.list({
      batchId: batch.id,
      limit: 10000,
      offset: 0,
    });

    const rows = items as unknown as InvoiceExportRow[];

    if (rows.length === 0) {
      // Puede pasar si batch procesado pero sin invoices (caso borde)
      throw Errors.Conflict('Batch has no invoices to export', { batchId: batch.id });
    }

    // Validación defensiva: si el repo no trajo joins, te enterás acá
    const missingJoinData = rows.some(
      (r) => r.customerId == null || r.serviceId == null || !r.serviceDate,
    );
    if (missingJoinData) {
      throw Errors.Internal(
        'InvoiceRepository did not provide required data for export (customerId/serviceId/serviceDate). ' +
          'Implement joins invoices->pendings->services in infrastructure.',
        { batchId: batch.id },
      );
    }

    const documents: AccountingExportDTO['documents'] = rows.map((inv) => {
      const issueDate = toISODate(inv.issueDate);
      const serviceDate = toISODate(inv.serviceDate);

      // Para challenge: sin IVA modelado => taxAmount = 0
      const net = Number(inv.amount);
      const tax = 0;
      const total = net + tax;

      return {
        externalRef: `BATCH-${batch.id}-INVOICE-${inv.id}`,
        docType: 'INVOICE',
        invoiceNumber: inv.invoiceNumber,
        cae: inv.cae,
        issueDate,
        customer: { id: inv.customerId },
        totals: {
          currency: 'ARS',
          netAmount: net,
          taxAmount: tax,
          totalAmount: total,
        },
        items: [
          {
            lineNumber: 1,
            description: `Logistics service ${inv.serviceId}`,
            quantity: 1,
            unitPrice: net,
            netAmount: net,
            references: {
              serviceId: inv.serviceId,
              serviceDate,
              pendingId: inv.pendingId,
            },
          },
        ],
      };
    });

    return {
      exportVersion: '1.0',
      generatedAt: new Date().toISOString(),
      batch: {
        id: batch.id,
        issueDate: toISODate(batch.issueDate),
        receiptBook: batch.receiptBook,
        status: batch.status,
      },
      documents,
    };
  }
}

function toISODate(d: Date): string {
  // YYYY-MM-DD en UTC (suficiente para challenge)
  const iso = new Date(d).toISOString();
  return iso.slice(0, 10);
}
