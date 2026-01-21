import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { BillingPendingStatus } from '../../domain/billing-pending/billing-pending.enum';

export class ListPendingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  serviceDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  serviceDateTo?: Date;

  @IsOptional()
  @IsEnum(BillingPendingStatus)
  status?: BillingPendingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
