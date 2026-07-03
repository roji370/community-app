import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/otp/request
   * Send OTP to a phone number. Rate-limited to 3 per 10 minutes.
   */
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  /**
   * POST /api/auth/otp/verify
   * Verify OTP and receive JWT tokens.
   * Returns { accessToken, refreshToken, user, isNewUser }
   * - If isNewUser=true, use the accessToken to call /api/users/onboard
   * - If isNewUser=false and user.status=PENDING_APPROVAL, show pending screen
   * - If isNewUser=false and user.status=ACTIVE, proceed to home
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  /**
   * POST /api/auth/refresh
   * Exchange a refresh token for a new access + refresh token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }
}
