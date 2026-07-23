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
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintQueryDto, CreateComplaintDto, ReopenComplaintDto } from './dto/complaints.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActiveStatusGuard } from '../auth/guards/active-status.guard';

interface ResidentUser {
  id: string;
  unitId: string | null;
  societyId: string | null;
  status: string;
}

@Controller('complaints')
@UseGuards(JwtAuthGuard, ActiveStatusGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // List complaints for the resident's unit
  @Get()
  getComplaints(
    @Request() req: { user: ResidentUser },
    @Query() query: ComplaintQueryDto,
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return { complaints: [], total: 0, page: 1, limit: 20 };

    return this.complaintsService.getComplaintsForUnit(
      unitId,
      query.page || 1,
      query.limit || 20,
      query.status,
    );
  }

  // Dashboard summary: open count, breached count, resolved this month
  @Get('summary')
  getSummary(@Request() req: { user: ResidentUser }) {
    const unitId = req.user.unitId;
    if (!unitId) {
      return { openCount: 0, breachedCount: 0, resolvedThisMonth: 0 };
    }

    return this.complaintsService.getComplaintsSummary(unitId);
  }

  // Single complaint detail
  @Get(':id')
  getComplaint(
    @Param('id') id: string,
    @Request() req: { user: ResidentUser },
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return null;

    return this.complaintsService.getComplaintById(id, unitId);
  }

  // Create new complaint
  @Post()
  createComplaint(
    @Body() dto: CreateComplaintDto,
    @Request() req: { user: ResidentUser },
  ) {
    const unitId = req.user.unitId;
    const societyId = req.user.societyId;
    if (!unitId || !societyId) return null;

    return this.complaintsService.createComplaint(unitId, societyId, req.user.id, {
      category: dto.category,
      description: dto.description,
      priority: dto.priority,
      photoUrls: dto.photoUrls,
    });
  }

  // Reopen a resolved complaint
  @Patch(':id/reopen')
  reopenComplaint(
    @Param('id') id: string,
    @Body() dto: ReopenComplaintDto,
    @Request() req: { user: ResidentUser },
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return null;

    return this.complaintsService.reopenComplaint(id, unitId, dto.reason);
  }
}
