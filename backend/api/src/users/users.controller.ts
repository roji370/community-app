import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { OnboardUserDto, UpdateNotificationPreferenceDto } from './dto/users.dto';
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
   * GET /api/users/me/notification-preferences
   * Get all notification preference categories with enabled state.
   */
  @Get('me/notification-preferences')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard)
  async getNotificationPreferences(@Request() req: { user: { id: string } }) {
    return this.usersService.getNotificationPreferences(req.user.id);
  }

  /**
   * PATCH /api/users/me/notification-preferences
   * Toggle a notification category on/off. SECURITY cannot be disabled.
   */
  @Patch('me/notification-preferences')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard)
  async updateNotificationPreference(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.usersService.updateNotificationPreference(
      req.user.id,
      dto.category,
      dto.enabled,
    );
  }

  /**
   * GET /api/users/me/notices
   * Get society notices for the current resident (paginated).
   */
  @Get('me/notices')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard)
  async getNotices(
    @Request() req: { user: { societyId: string | null } },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return { notices: [], total: 0, page: 1, limit: 20 };
    return this.usersService.getNoticesForResident(
      societyId,
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * POST /api/users/me/notices/:id/acknowledge
   * Acknowledge a notice that requires acknowledgment.
   */
  @Post('me/notices/:id/acknowledge')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard)
  async acknowledgeNotice(
    @Param('id') noticeId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usersService.acknowledgeNotice(noticeId, req.user.id);
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
