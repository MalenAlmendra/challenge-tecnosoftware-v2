import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ExecuteBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  pendingIds: number[];

  @IsDateString()
  issueDate: string;

  @IsString()
  @IsNotEmpty()
  receiptBook: string;
}
