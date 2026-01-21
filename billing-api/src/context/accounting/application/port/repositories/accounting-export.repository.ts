export enum ExportStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ERROR = 'ERROR',
}

export type AccountingExportRecord = {
  id: number;
  batchId: number;
  status: ExportStatus;
  payload: unknown; // JSON
  externalRequestId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
};

export interface AccountingExportRepository {
  findByBatchId(batchId: number): Promise<AccountingExportRecord | null>;
  create(data: {
    batchId: number;
    status: ExportStatus;
    payload: unknown;
  }): Promise<AccountingExportRecord>;

  markSent(params: {
    id: number;
    externalRequestId: string;
    sentAt: Date;
  }): Promise<void>;

  markError(params: {
    id: number;
    errorMessage: string;
  }): Promise<void>;
}
