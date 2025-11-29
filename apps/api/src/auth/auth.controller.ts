import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestMagicLinkDto, VerifyMagicLinkDto, GuestAuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  verifyMagicLink(@Body() dto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(dto.token);
  }

  @Post('guest')
  createGuestUser(@Body() dto: GuestAuthDto) {
    return this.authService.createGuestUser(dto.name, dto.deviceId);
  }
}
