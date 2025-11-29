import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  description: string;

  @IsString()
  @IsNotEmpty()
  paidById: string;

  @IsString()
  @IsNotEmpty()
  createdById: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
