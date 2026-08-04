import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { CommitteeService } from './committee.service';
import {
  VisitorQueryDto,
  ComplaintQueryDto,
  UpdateComplaintStatusDto,
  BillingQueryDto,
  CreateNoticeDto,
  NoticeQueryDto,
} from './dto/committee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActiveStatusGuard } from '../auth/guards/active-status.guard';
import { CommitteeRoleGuard } from './guards/committee-role.guard';

interface CommitteeUser {
  id: string;
  societyId: string | null;
  role: string;
  status: string;
}

@Controller('committee')
@UseGuards(JwtAuthGuard, ActiveStatusGuard, CommitteeRoleGuard)
export class CommitteeController {
  constructor(private readonly committeeService: CommitteeService) {}

  // ── Dashboard Stats ────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard(@Request() req: { user: CommitteeUser }) {
    const societyId = req.user.societyId;
    if (!societyId) return null;
    return this.committeeService.getDashboardStats(societyId);
  }

  // ── Visitor Log ────────────────────────────────────────────────────
  @Get('visitors')
  getVisitors(
    @Request() req: { user: CommitteeUser },
    @Query() query: VisitorQueryDto,
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return { visitors: [], total: 0, page: 1, limit: 20 };
    return this.committeeService.getVisitorLog(
      societyId,
      query.page || 1,
      query.limit || 20,
      query.status,
      query.unitId,
      query.dateFrom,
      query.dateTo,
    );
  }

  // ── Visitor Log CSV Export ─────────────────────────────────────────
  @Get('visitors/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="visitors.csv"')
  async exportVisitors(
    @Request() req: { user: CommitteeUser },
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return '';
    return this.committeeService.exportVisitorsCsv(
      societyId,
      status,
      dateFrom,
      dateTo,
    );
  }

  // ── Complaint Queue ────────────────────────────────────────────────
  @Get('complaints')
  getComplaints(
    @Request() req: { user: CommitteeUser },
    @Query() query: ComplaintQueryDto,
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return { complaints: [], total: 0, page: 1, limit: 20 };
    return this.committeeService.getComplaints(
      societyId,
      query.page || 1,
      query.limit || 20,
      query.status,
      query.priority,
      query.category,
      query.unitId,
    );
  }

  // ── Update Complaint Status ────────────────────────────────────────
  @Patch('complaints/:id/status')
  updateComplaintStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @Request() req: { user: CommitteeUser },
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return null;
    return this.committeeService.updateComplaintStatus(id, societyId, dto.newStatus);
  }

  // ── Billing ────────────────────────────────────────────────────────
  @Get('billing')
  getBills(
    @Request() req: { user: CommitteeUser },
    @Query() query: BillingQueryDto,
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return { bills: [], total: 0, page: 1, limit: 20 };
    return this.committeeService.getBills(
      societyId,
      query.page || 1,
      query.limit || 20,
      query.status,
      query.unitId,
    );
  }

  // ── Billing Overview ───────────────────────────────────────────────
  @Get('billing/overview')
  getBillingOverview(@Request() req: { user: CommitteeUser }) {
    const societyId = req.user.societyId;
    if (!societyId) return null;
    return this.committeeService.getBillingOverview(societyId);
  }

  // ── Create Notice ──────────────────────────────────────────────────
  @Post('notices')
  createNotice(
    @Body() dto: CreateNoticeDto,
    @Request() req: { user: CommitteeUser },
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return null;
    return this.committeeService.createNotice(societyId, req.user.id, {
      title: dto.title,
      body: dto.body,
      requiresAcknowledgment: dto.requiresAcknowledgment,
    });
  }

  // ── List Notices ───────────────────────────────────────────────────
  @Get('notices')
  getNotices(
    @Request() req: { user: CommitteeUser },
    @Query() query: NoticeQueryDto,
  ) {
    const societyId = req.user.societyId;
    if (!societyId) return { notices: [], total: 0, page: 1, limit: 20 };
    return this.committeeService.getNotices(
      societyId,
      query.page || 1,
      query.limit || 20,
    );
  }
}
