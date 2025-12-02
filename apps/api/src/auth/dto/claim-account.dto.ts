import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ClaimAccountDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
