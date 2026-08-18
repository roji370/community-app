import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ComplaintStatus,
  ComplaintPriority,
  VisitorStatus,
  BillStatus,
} from '@prisma/client';

// SLA durations by priority (in milliseconds) — matches complaints service
const SLA_DURATIONS: Record<ComplaintPriority, number> = {
  HIGH: 24 * 60 * 60 * 1000,
  MEDIUM: 72 * 60 * 60 * 1000,
  LOW: 7 * 24 * 60 * 60 * 1000,
};

// Valid status transitions for committee actions
const VALID_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  OPEN: [ComplaintStatus.ACKNOWLEDGED],
  ACKNOWLEDGED: [ComplaintStatus.IN_PROGRESS],
  IN_PROGRESS: [ComplaintStatus.RESOLVED],
  REOPENED: [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS],
  RESOLVED: [], // Committee can't transition from RESOLVED (resident reopens)
};

@Injectable()
export class CommitteeService {
  private readonly logger = new Logger(CommitteeService.name);

  constructor(private prisma: PrismaService) {}

  // ── Dashboard Stats ──────────────────────────────────────────────────
  async getDashboardStats(societyId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUnits,
      activeResidents,
      pendingApprovals,
      todayVisitors,
      openComplaints,
      slaBreaches,
      totalBillsDueThisMonth,
      paidBillsThisMonth,
      recentVisitors,
      recentComplaints,
    ] = await Promise.all([
      // Total units
      this.prisma.unit.count({ where: { societyId } }),

      // Active residents
      this.prisma.user.count({
        where: { societyId, status: 'ACTIVE' },
      }),

      // Pending approvals
      this.prisma.user.count({
        where: { societyId, status: 'PENDING_APPROVAL' },
      }),

      // Today's visitors
      this.prisma.visitor.count({
        where: { societyId, createdAt: { gte: startOfDay } },
      }),

      // Open complaints (all non-resolved)
      this.prisma.complaint.count({
        where: {
          societyId,
          status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
        },
      }),

      // SLA breaches (past due and not resolved)
      this.prisma.complaint.count({
        where: {
          societyId,
          status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
          slaDueAt: { lt: now },
        },
      }),

      // Total bills due this month
      this.prisma.bill.count({
        where: {
          societyId,
          dueDate: { gte: startOfMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
        },
      }),

      // Paid bills this month
      this.prisma.bill.count({
        where: {
          societyId,
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
      }),

      // Recent 5 visitors
      this.prisma.visitor.findMany({
        where: { societyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          unit: { select: { identifier: true } },
          guard: { select: { name: true } },
        },
      }),

      // Recent 5 complaints
      this.prisma.complaint.findMany({
        where: { societyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          unit: { select: { identifier: true } },
          createdByUser: { select: { name: true } },
        },
      }),
    ]);

    const collectionRate =
      totalBillsDueThisMonth > 0
        ? Math.round((paidBillsThisMonth / totalBillsDueThisMonth) * 100)
        : 0;

    return {
      totalUnits,
      activeResidents,
      pendingApprovals,
      todayVisitors,
      openComplaints,
      slaBreaches,
      collectionRate,
      recentVisitors,
      recentComplaints: recentComplaints.map((c) => ({
        ...c,
        sla: this.calculateSlaInfo(c.slaDueAt, c.status, c.resolvedAt),
      })),
    };
  }

  // ── Visitor Log ──────────────────────────────────────────────────────
  async getVisitorLog(
    societyId: string,
    page = 1,
    limit = 20,
    status?: VisitorStatus,
    unitId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { societyId };
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [visitors, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          unit: { select: { identifier: true } },
          guard: { select: { name: true } },
          respondedByUser: { select: { name: true } },
        },
      }),
      this.prisma.visitor.count({ where }),
    ]);

    return { visitors, total, page, limit };
  }

  // ── Complaint Queue ──────────────────────────────────────────────────
  async getComplaints(
    societyId: string,
    page = 1,
    limit = 20,
    status?: ComplaintStatus,
    priority?: ComplaintPriority,
    category?: string,
    unitId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { societyId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (unitId) where.unitId = unitId;

    const [complaints, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: [{ slaDueAt: 'asc' }, { createdAt: 'desc' }],
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

  // ── Update Complaint Status ──────────────────────────────────────────
  async updateComplaintStatus(
    complaintId: string,
    societyId: string,
    newStatus: ComplaintStatus,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.societyId !== societyId) {
      throw new NotFoundException('Complaint not found in this society');
    }

    // Validate status transition
    const allowed = VALID_TRANSITIONS[complaint.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${complaint.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    // Build update data with timestamps
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'ACKNOWLEDGED') {
      updateData.acknowledgedAt = new Date();
    } else if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        unit: { select: { identifier: true } },
        createdByUser: { select: { name: true } },
      },
    });

    this.logger.log(
      `Complaint ${complaintId} status changed: ${complaint.status} → ${newStatus}`,
    );

    return {
      ...updated,
      sla: this.calculateSlaInfo(updated.slaDueAt, updated.status, updated.resolvedAt),
    };
  }

  // ── Billing ──────────────────────────────────────────────────────────
  async getBills(
    societyId: string,
    page = 1,
    limit = 20,
    status?: BillStatus,
    unitId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { societyId };
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        orderBy: { dueDate: 'desc' },
        skip,
        take: limit,
        include: {
          unit: {
            select: {
              identifier: true,
              users: {
                where: { status: 'ACTIVE' },
                select: { name: true, role: true },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.bill.count({ where }),
    ]);

    return { bills, total, page, limit };
  }

  // ── Billing Overview ─────────────────────────────────────────────────
  async getBillingOverview(societyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totalExpected, totalCollected, overdueCount, pendingCount] =
      await Promise.all([
        // Total expected this month
        this.prisma.bill.aggregate({
          where: {
            societyId,
            dueDate: { gte: startOfMonth, lt: endOfMonth },
          },
          _sum: { amountDue: true },
          _count: true,
        }),

        // Total collected this month
        this.prisma.bill.aggregate({
          where: {
            societyId,
            status: 'PAID',
            paidAt: { gte: startOfMonth },
          },
          _sum: { amountPaid: true },
          _count: true,
        }),

        // Overdue bills
        this.prisma.bill.count({
          where: { societyId, status: 'OVERDUE' },
        }),

        // Pending bills
        this.prisma.bill.count({
          where: { societyId, status: 'PENDING' },
        }),
      ]);

    const expectedAmount = totalExpected._sum.amountDue || 0;
    const collectedAmount = totalCollected._sum.amountPaid || 0;
    const collectionRate =
      expectedAmount > 0
        ? Math.round((collectedAmount / expectedAmount) * 100)
        : 0;

    // Per-unit breakdown
    const unitBreakdown = await this.prisma.bill.groupBy({
      by: ['unitId', 'status'],
      where: { societyId },
      _sum: { amountDue: true, amountPaid: true },
      _count: true,
    });

    return {
      expectedAmount,
      collectedAmount,
      collectionRate,
      totalBills: totalExpected._count,
      paidBills: totalCollected._count,
      overdueCount,
      pendingCount,
      unitBreakdown,
    };
  }

  // ── Notices ──────────────────────────────────────────────────────────
  async createNotice(
    societyId: string,
    userId: string,
    data: { title: string; body: string; requiresAcknowledgment?: boolean },
  ) {
    const notice = await this.prisma.notice.create({
      data: {
        societyId,
        createdByUserId: userId,
        title: data.title,
        body: data.body,
        requiresAcknowledgment: data.requiresAcknowledgment ?? false,
        acknowledgedByUserIds: [],
      },
      include: {
        createdByUser: { select: { name: true } },
      },
    });

    this.logger.log(`Notice created: "${notice.title}" by user ${userId}`);

    return notice;
  }

  async getNotices(societyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where: { societyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdByUser: { select: { name: true } },
        },
      }),
      this.prisma.notice.count({ where: { societyId } }),
    ]);

    // Enrich with acknowledgment stats
    const enriched = await Promise.all(
      notices.map(async (notice) => {
        const totalResidents = await this.prisma.user.count({
          where: { societyId, status: 'ACTIVE' },
        });

        return {
          ...notice,
          acknowledgmentStats: notice.requiresAcknowledgment
            ? {
                acknowledged: notice.acknowledgedByUserIds.length,
                total: totalResidents,
                percentage: totalResidents > 0
                  ? Math.round(
                      (notice.acknowledgedByUserIds.length / totalResidents) * 100,
                    )
                  : 0,
              }
            : null,
        };
      }),
    );

    return { notices: enriched, total, page, limit };
  }

  // ── SLA info helper (same logic as ComplaintsService) ─────────────────
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

    return {
      slaDueAt: slaDueAt.toISOString(),
      remainingMs: isResolved ? null : remainingMs,
      isBreached: isResolved
        ? resolvedAt
          ? resolvedAt > slaDueAt
          : false
        : isBreached,
      resolvedWithinSla:
        isResolved && resolvedAt ? resolvedAt <= slaDueAt : null,
      status: isResolved
        ? resolvedAt && resolvedAt <= slaDueAt
          ? 'RESOLVED_WITHIN_SLA'
          : 'RESOLVED_AFTER_SLA'
        : isBreached
          ? 'BREACHED'
          : remainingMs < 3600000
            ? 'CRITICAL'
            : 'ON_TRACK',
    };
  }

  // ── CSV Export ──────────────────────────────────────────────────────────
  async exportVisitorsCsv(
    societyId: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<string> {
    const where: Record<string, unknown> = { societyId };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const visitors = await this.prisma.visitor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { select: { identifier: true } },
        guard: { select: { name: true } },
        respondedByUser: { select: { name: true } },
      },
    });

    const header = 'Name,Phone,Purpose,Unit,Guard,Status,Entry Time,Responded By\n';

    // Escape a CSV field: wrap in quotes, double any internal quotes
    const esc = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const rows = visitors.map((v) => {
      const fields = [
        esc(v.name),
        esc(v.phone || ''),
        esc(v.purpose),
        esc(v.unit.identifier),
        esc(v.guard?.name || ''),
        esc(v.status),
        esc(v.createdAt.toISOString()),
        esc(v.respondedByUser?.name || ''),
      ];
      return fields.join(',');
    });

    return header + rows.join('\n');
  }
}
