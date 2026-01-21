import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrepareAccountingExportUseCase } from '../../application/use-cases/PrepareAccountingExport.usecase';
import { SendAccountingExportUseCase } from '../../application/use-cases/SendAccountingExport.usecase';

@ApiTags('Accounting Exports')
@ApiBearerAuth('access-token')
@Controller('accounting/exports')
export class AccountingExportsController {
  constructor(
    private readonly prepareExport: PrepareAccountingExportUseCase,
    private readonly sendExport: SendAccountingExportUseCase,
  ) {}

  @Get(':batchId')
  @ApiOperation({ summary: 'Prepare accounting export payload for a batch' })
  @ApiResponse({ status: 200, description: 'Export payload prepared' })
  async prepare(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.prepareExport.execute({ batchId });
  }

  @Post(':batchId/send')
  @ApiOperation({ summary: 'Send accounting export payload (simulation)' })
  @ApiResponse({ status: 201, description: 'Export sent (simulated)' })
  async send(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.sendExport.execute({ batchId });
  }
}
