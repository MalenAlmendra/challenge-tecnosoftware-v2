import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBillingBatchUseCase } from '../../application/use-cases/billing-batch/CreateBillingBatch.usecase';
import { ProcessBillingBatchUseCase } from '../../application/use-cases/billing-batch/ProcessBillingBatch.usecase';
import { GetBillingBatchResultUseCase } from '../../application/use-cases/billing-batch/GetBillingBatchResult.usecase';
import { ExecuteBatchDto } from '../dto/execute-batch.dto';

@ApiTags('Billing Batches')
@ApiBearerAuth('access-token')
@Controller('billing/batches')
export class BillingBatchesController {
  constructor(
    private readonly createBatch: CreateBillingBatchUseCase,
    private readonly processBatch: ProcessBillingBatchUseCase,
    private readonly batchResult: GetBillingBatchResultUseCase,
  ) {}

  @Post('execute')
  @ApiOperation({ summary: 'Create and execute a billing batch manually' })
  @ApiResponse({ status: 201, description: 'Batch executed' })
  async execute(@Body() body: ExecuteBatchDto) {
    const batch = await this.createBatch.execute({
      issueDate: new Date(body.issueDate),
      receiptBook: body.receiptBook,
      pendingIds: body.pendingIds,
    });

    const result = await this.processBatch.execute({
      batchId: batch.id,
      pendingIds: body.pendingIds,
    });

    return {
      batch,
      result,
    };
  }

  @Get(':batchId/result')
  @ApiOperation({ summary: 'Get billing batch result' })
  @ApiResponse({ status: 200, description: 'Batch result retrieved' })
  async getResult(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.batchResult.execute(batchId);
  }
}
