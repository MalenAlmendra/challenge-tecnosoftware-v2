import { AccountingExportDTO } from '../../use-cases/PrepareAccountingExport.usecase';

export type SendResult = {
  externalRequestId: string;
  sentAt: string; // ISO
};

export interface AccountingErpClient {
  send(payload: AccountingExportDTO): Promise<SendResult>;
}