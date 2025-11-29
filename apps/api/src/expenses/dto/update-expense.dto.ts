import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  IsArray,
  ArrayMinSize,
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

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  splitParticipants?: string[];
}
