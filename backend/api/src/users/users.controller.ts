import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { OnboardUserDto } from './dto/users.dto';
import { RegisterFcmTokenDto } from '../visitors/dto/visitors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActiveStatusGuard } from '../auth/guards/active-status.guard';
import { FcmService } from '../notifications/fcm.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * POST /api/users/onboard
   * Register a new user with a society and unit.
   * Requires an onboarding JWT token (issued after OTP verify for new users).
   */
  @Post('onboard')
  @UseGuards(JwtAuthGuard)
  async onboard(@Request() req: any, @Body() dto: OnboardUserDto) {
    const phone = req.user.phone;
    return this.usersService.onboard(phone, dto);
  }

  /**
   * GET /api/users/me
   * Get current authenticated user's profile.
   * Works for both ACTIVE and PENDING_APPROVAL users (no ActiveStatusGuard).
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    // For onboarding tokens, return minimal info
    if (req.user.isOnboarding) {
      return { phone: req.user.phone, isOnboarding: true };
    }
    return this.usersService.getProfile(req.user.id);
  }

  /**
   * GET /api/users/me/status
   * Quick status check (for pending approval screen polling).
   * Lightweight endpoint that returns only the status field.
   */
  @Get('me/status')
  @UseGuards(JwtAuthGuard)
  async checkStatus(@Request() req: any) {
    if (req.user.isOnboarding) {
      return { status: 'ONBOARDING' };
    }
    return this.usersService.checkStatus(req.user.id);
  }

  /**
   * GET /api/users/societies/search?q=sunrise
   * Search societies by name or pincode (for onboarding flow).
   * Public-ish — requires JWT but no active status.
   */
  @Get('societies/search')
  @UseGuards(JwtAuthGuard)
  async searchSocieties(@Query('q') query: string) {
    return this.usersService.searchSocieties(query);
  }

  /**
   * GET /api/users/societies/:societyId/units
   * List units for a society (for onboarding unit selection).
   */
  @Get('societies/:societyId/units')
  @UseGuards(JwtAuthGuard)
  async getUnits(@Param('societyId') societyId: string) {
    return this.usersService.getUnitsForSociety(societyId);
  }

  /**
   * POST /api/users/fcm-token
   * Register a Firebase Cloud Messaging token for push notifications.
   * Called by the resident app after login and on token refresh.
   */
  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  async registerFcmToken(
    @Request() req: { user: { id: string } },
    @Body() dto: RegisterFcmTokenDto,
  ) {
    await this.fcmService.upsertToken(req.user.id, dto.token, dto.platform);
    return { registered: true };
  }
}
