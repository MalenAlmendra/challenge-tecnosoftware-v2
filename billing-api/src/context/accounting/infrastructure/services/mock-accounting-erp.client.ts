import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AccountingErpClient, SendResult } from '../../application/port/services/accounting-erp-client.port';
import { AccountingExportDTO } from '../../application/use-cases/PrepareAccountingExport.usecase';

@Injectable()
export class MockAccountingErpClient implements AccountingErpClient {
  async send(payload: AccountingExportDTO): Promise<SendResult> {
    void payload;
    return {
      externalRequestId: `ERP-${randomUUID()}`,
      sentAt: new Date().toISOString(),
    };
  }
}
