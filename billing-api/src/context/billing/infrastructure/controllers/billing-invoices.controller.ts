import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListInvoicesUseCase } from '../../application/use-cases/invoice/ListInvoices.usecase';
import { ListInvoicesQueryDto } from '../dto/list-invoices.query.dto';

@ApiTags('Billing Invoices')
@ApiBearerAuth('access-token')
@Controller('billing/invoices')
export class BillingInvoicesController {
  constructor(private readonly listInvoices: ListInvoicesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List invoices with filters' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved' })
  async list(@Query() query: ListInvoicesQueryDto) {
    return this.listInvoices.execute({
      batchId: query.batchId,
      customerId: query.customerId,
      receiptBook: query.receiptBook,
      issueDateFrom: query.issueDateFrom,
      issueDateTo: query.issueDateTo,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
