import { IsNotEmpty, IsString } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
