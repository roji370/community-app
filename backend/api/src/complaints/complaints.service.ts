import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '@prisma/client';

// SLA durations by priority (in milliseconds)
const SLA_DURATIONS: Record<ComplaintPriority, number> = {
  HIGH: 24 * 60 * 60 * 1000,       // 24 hours
  MEDIUM: 72 * 60 * 60 * 1000,     // 72 hours
  LOW: 7 * 24 * 60 * 60 * 1000,    // 7 days
};

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(private prisma: PrismaService) {}

  // ── List complaints for a unit ────────────────────────────────────────
  async getComplaintsForUnit(
    unitId: string,
    page = 1,
    limit = 20,
    status?: ComplaintStatus,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { unitId };
    if (status) where.status = status;

    const [complaints, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          unit: { select: { identifier: true } },
          createdByUser: { select: { name: true } },
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    // Enrich with SLA info
    const enriched = complaints.map((c) => ({
      ...c,
      sla: this.calculateSlaInfo(c.slaDueAt, c.status, c.resolvedAt),
    }));

    return { complaints: enriched, total, page, limit };
  }

  // ── Dashboard summary for a unit ──────────────────────────────────────
  async getComplaintsSummary(unitId: string) {
    const now = new Date();

    // Count open complaints (OPEN, ACKNOWLEDGED, IN_PROGRESS, REOPENED)
    const openCount = await this.prisma.complaint.count({
      where: {
        unitId,
        status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
      },
    });

    // Count SLA-breached complaints (past slaDueAt and not resolved)
    const breachedCount = await this.prisma.complaint.count({
      where: {
        unitId,
        status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
        slaDueAt: { lt: now },
      },
    });

    // Count resolved this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolvedThisMonth = await this.prisma.complaint.count({
      where: {
        unitId,
        status: 'RESOLVED',
        resolvedAt: { gte: startOfMonth },
      },
    });

    return { openCount, breachedCount, resolvedThisMonth };
  }

  // ── Single complaint detail ───────────────────────────────────────────
  async getComplaintById(complaintId: string, unitId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        unit: { select: { identifier: true } },
        createdByUser: { select: { name: true } },
      },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.unitId !== unitId) {
      throw new ForbiddenException('This complaint does not belong to your unit');
    }

    return {
      ...complaint,
      sla: this.calculateSlaInfo(complaint.slaDueAt, complaint.status, complaint.resolvedAt),
    };
  }

  // ── Create new complaint ──────────────────────────────────────────────
  async createComplaint(
    unitId: string,
    societyId: string,
    userId: string,
    data: {
      category: ComplaintCategory;
      description: string;
      priority?: ComplaintPriority;
      photoUrls?: string[];
    },
  ) {
    const priority = data.priority || ComplaintPriority.MEDIUM;
    const now = new Date();
    const slaDueAt = new Date(now.getTime() + SLA_DURATIONS[priority]);

    const complaint = await this.prisma.complaint.create({
      data: {
        unitId,
        societyId,
        createdByUserId: userId,
        category: data.category,
        description: data.description,
        priority,
        photoUrls: data.photoUrls || [],
        slaDueAt,
      },
      include: {
        unit: { select: { identifier: true } },
        createdByUser: { select: { name: true } },
      },
    });

    this.logger.log(
      `Complaint ${complaint.id} created — ${data.category}/${priority}, SLA due: ${slaDueAt.toISOString()}`,
    );

    return {
      ...complaint,
      sla: this.calculateSlaInfo(complaint.slaDueAt, complaint.status, complaint.resolvedAt),
    };
  }

  // ── Reopen a resolved complaint ───────────────────────────────────────
  async reopenComplaint(complaintId: string, unitId: string, reason?: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.unitId !== unitId) {
      throw new ForbiddenException('This complaint does not belong to your unit');
    }
    if (complaint.status !== 'RESOLVED') {
      throw new BadRequestException('Only resolved complaints can be reopened');
    }

    const now = new Date();
    const slaDueAt = new Date(now.getTime() + SLA_DURATIONS[complaint.priority]);

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'REOPENED',
        reopenedAt: now,
        reopenCount: { increment: 1 },
        resolvedAt: null,
        slaDueAt,
      },
      include: {
        unit: { select: { identifier: true } },
        createdByUser: { select: { name: true } },
      },
    });

    this.logger.log(
      `Complaint ${complaintId} reopened (count: ${updated.reopenCount})${reason ? ` — reason: ${reason}` : ''}`,
    );

    return {
      ...updated,
      sla: this.calculateSlaInfo(updated.slaDueAt, updated.status, updated.resolvedAt),
    };
  }

  // ── Scheduled: check SLA breaches every 10 minutes ────────────────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkSlaBreaches() {
    const now = new Date();

    const breachedComplaints = await this.prisma.complaint.findMany({
      where: {
        status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
        slaDueAt: { lt: now },
      },
      select: { id: true, category: true, priority: true, slaDueAt: true },
    });

    if (breachedComplaints.length > 0) {
      this.logger.warn(
        `SLA BREACH: ${breachedComplaints.length} complaint(s) have exceeded their SLA deadline`,
      );
      for (const c of breachedComplaints) {
        const overdue = Math.round((now.getTime() - c.slaDueAt.getTime()) / (60 * 60 * 1000));
        this.logger.warn(`  → ${c.id} (${c.category}/${c.priority}) — ${overdue}h overdue`);
      }
    }
  }

  // ── SLA info helper ───────────────────────────────────────────────────
  private calculateSlaInfo(
    slaDueAt: Date,
    status: ComplaintStatus,
    resolvedAt: Date | null,
  ) {
    const now = new Date();
    const isResolved = status === 'RESOLVED';
    const referenceTime = isResolved && resolvedAt ? resolvedAt : now;
    const remainingMs = slaDueAt.getTime() - referenceTime.getTime();
    const isBreached = remainingMs < 0;
    const totalSlaMs = slaDueAt.getTime() - (slaDueAt.getTime() - Math.abs(remainingMs)); // approximate

    return {
      slaDueAt: slaDueAt.toISOString(),
      remainingMs: isResolved ? null : remainingMs,
      isBreached: isResolved ? (resolvedAt ? resolvedAt > slaDueAt : false) : isBreached,
      resolvedWithinSla: isResolved && resolvedAt ? resolvedAt <= slaDueAt : null,
      status: isResolved
        ? resolvedAt && resolvedAt <= slaDueAt
          ? 'RESOLVED_WITHIN_SLA'
          : 'RESOLVED_AFTER_SLA'
        : isBreached
          ? 'BREACHED'
          : remainingMs < 3600000 // less than 1 hour
            ? 'CRITICAL'
            : 'ON_TRACK',
    };
  }
}
