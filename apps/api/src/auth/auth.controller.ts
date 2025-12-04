import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RequestMagicLinkDto,
  VerifyMagicLinkDto,
  GuestAuthDto,
  DismissUpgradePromptDto,
  ClaimAccountDto,
} from './dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Public()
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(dto.token);
  }

  @Public()
  @Post('guest')
  async createGuestUser(@Body() dto: GuestAuthDto) {
    return this.authService.createGuestUser(dto.name, dto.deviceId);
  }

  @Public()
  @Post('guest/dismiss-upgrade-prompt')
  @HttpCode(HttpStatus.OK)
  async dismissUpgradePrompt(@Body() dto: DismissUpgradePromptDto) {
    const result = await this.authService.dismissUpgradePrompt(dto.deviceId);
    if (!result) {
      throw new NotFoundException('Guest user not found for this device');
    }
    return result;
  }

  @Public()
  @Post('guest/claim')
  @HttpCode(HttpStatus.OK)
  async claimGuestAccount(@Body() dto: ClaimAccountDto) {
    const result = await this.authService.claimGuestAccount(
      dto.deviceId,
      dto.email,
    );
    if ('error' in result) {
      if (result.code === 404) {
        throw new NotFoundException(result.error);
      }
      if (result.code === 409) {
        throw new ConflictException(result.error);
      }
    }
    return result;
  }
}
