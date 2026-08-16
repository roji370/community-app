import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StaffAttendanceService } from './staff-attendance.service';
import { CheckInDto } from './dto/staff-attendance.dto';
import { GuardJwtAuthGuard } from '../guard-auth/guards/guard-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActiveStatusGuard } from '../auth/guards/active-status.guard';
import { CommitteeRoleGuard } from '../committee/guards/committee-role.guard';
import { GuardJwtPayload } from '../guard-auth/strategies/guard-jwt.strategy';

@Controller('staff-attendance')
export class StaffAttendanceController {
  constructor(
    private readonly staffAttendanceService: StaffAttendanceService,
  ) {}

  // ── Guard: check in staff ─────────────────────────────────────────────
  @Post('check-in')
  @UseGuards(GuardJwtAuthGuard)
  checkIn(
    @Body() dto: CheckInDto,
    @Request() req: { user: GuardJwtPayload },
  ) {
    return this.staffAttendanceService.checkIn(
      dto,
      req.user.guardId,
      req.user.societyId,
    );
  }

  // ── Guard: check out staff ────────────────────────────────────────────
  @Patch(':id/check-out')
  @UseGuards(GuardJwtAuthGuard)
  checkOut(
    @Param('id') id: string,
    @Request() req: { user: GuardJwtPayload },
  ) {
    return this.staffAttendanceService.checkOut(id, req.user.guardId);
  }

  // ── Guard: today's log ────────────────────────────────────────────────
  @Get('today')
  @UseGuards(GuardJwtAuthGuard)
  getTodayLog(@Request() req: { user: GuardJwtPayload }) {
    return this.staffAttendanceService.getTodayLog(req.user.societyId);
  }

  // ── Committee: full attendance log with filters ───────────────────────
  @Get('log')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard, CommitteeRoleGuard)
  getAttendanceLog(
    @Request() req: { user: { societyId: string | null } },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('staffType') staffType?: string,
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return { records: [], total: 0, page: 1, limit: 20 };
    return this.staffAttendanceService.getAttendanceLog(
      societyId,
      parseInt(page),
      parseInt(limit),
      dateFrom,
      dateTo,
      staffType,
    );
  }
}
