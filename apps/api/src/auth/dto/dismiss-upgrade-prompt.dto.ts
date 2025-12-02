import { IsNotEmpty, IsString } from 'class-validator';

export class DismissUpgradePromptDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
