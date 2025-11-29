import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'differentUsers', async: false })
class DifferentUsersConstraint implements ValidatorConstraintInterface {
  validate(toUserId: string, args: ValidationArguments) {
    const obj = args.object as CreateSettlementDto;
    return obj.fromUserId !== toUserId;
  }

  defaultMessage() {
    return 'fromUserId and toUserId must be different';
  }
}

export class CreateSettlementDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  @Validate(DifferentUsersConstraint)
  toUserId: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Transform(({ value }) => Number(value))
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsNotEmpty()
  createdById: string;
}
