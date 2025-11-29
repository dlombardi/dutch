import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GuestAuthDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
