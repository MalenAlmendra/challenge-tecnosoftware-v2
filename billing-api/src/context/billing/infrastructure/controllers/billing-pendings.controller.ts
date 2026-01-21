import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListBillingPendingsUseCase } from '../../application/use-cases/billing-pending/ListBillingPendings.usecase';
import { ListPendingsQueryDto } from '../dto/list-pendings.query.dto';

@ApiTags('Billing Pendings')
@ApiBearerAuth('access-token')
@Controller('billing/pendings')
export class BillingPendingsController {
  constructor(private readonly listPendings: ListBillingPendingsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List billing pendings with filters' })
  @ApiResponse({ status: 200, description: 'Billing pendings retrieved' })
  async list(@Query() query: ListPendingsQueryDto) {
    return this.listPendings.execute({
      customerId: query.customerId,
      serviceDateFrom: query.serviceDateFrom,
      serviceDateTo: query.serviceDateTo,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
