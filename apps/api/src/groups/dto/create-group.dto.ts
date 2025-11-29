import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

  @IsString()
  @IsOptional()
  emoji?: string;

  @IsString()
  @IsNotEmpty()
  createdById: string;

  @IsString()
  @IsOptional()
  defaultCurrency?: string;
}
