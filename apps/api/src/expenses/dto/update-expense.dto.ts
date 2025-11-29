import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
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
}
