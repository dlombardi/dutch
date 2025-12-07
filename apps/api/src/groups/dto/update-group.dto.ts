import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  emoji?: string;

  @IsString()
  @IsOptional()
  defaultCurrency?: string;
}
