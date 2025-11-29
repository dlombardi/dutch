import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  IsArray,
  ArrayMinSize,
  IsIn,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'accommodation',
  'activities',
  'shopping',
  'utilities',
  'entertainment',
  'health',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

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

  @IsNumber()
  @IsPositive()
  @IsOptional()
  exchangeRate?: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  description: string;

  @IsString()
  @IsIn(EXPENSE_CATEGORIES)
  @IsOptional()
  category?: ExpenseCategory;

  @IsString()
  @IsNotEmpty()
  paidById: string;

  @IsString()
  @IsNotEmpty()
  createdById: string;

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

  @ValidateIf((o: CreateExpenseDto) => o.splitType === 'exact')
  @IsObject()
  @IsNotEmpty()
  splitAmounts?: Record<string, number>;
}
