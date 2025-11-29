import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  IsArray,
  ArrayMinSize,
  IsIn,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateExpenseDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @IsString()
  @IsOptional()
  paidById?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsIn(['equal', 'exact'])
  @IsOptional()
  splitType?: 'equal' | 'exact';

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  splitParticipants?: string[];

  @IsObject()
  @IsOptional()
  splitAmounts?: Record<string, number>;
}
