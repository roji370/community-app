import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/staff-attendance.dto';

@Injectable()
export class StaffAttendanceService {
  private readonly logger = new Logger(StaffAttendanceService.name);

  constructor(private prisma: PrismaService) {}

  // ── Guard logs staff check-in ─────────────────────────────────────────
  async checkIn(dto: CheckInDto, guardId: string, societyId: string) {
    const record = await this.prisma.staffAttendance.create({
      data: {
        societyId,
        guardId,
        staffName: dto.staffName,
        staffType: dto.staffType,
        unitId: dto.unitId || undefined,
      },
      include: {
        unit: { select: { identifier: true } },
      },
    });

    this.logger.log(
      `Staff check-in: ${record.staffName} (${record.staffType}) by guard ${guardId}`,
    );

    return record;
  }

  // ── Guard logs staff check-out ────────────────────────────────────────
  async checkOut(recordId: string, guardId: string) {
    // Atomic: only update if checkOut is still null (prevents double check-out race)
    const result = await this.prisma.staffAttendance.updateMany({
      where: {
        id: recordId,
        guardId,
        checkOut: null, // Only check out if not already checked out
      },
      data: { checkOut: new Date() },
    });

    if (result.count === 0) {
      // Determine why: record not found or already checked out
      const record = await this.prisma.staffAttendance.findFirst({
        where: { id: recordId },
      });
      if (!record) throw new NotFoundException('Attendance record not found');
      if (record.guardId !== guardId) throw new NotFoundException('Attendance record not found');
      throw new BadRequestException('Already checked out');
    }

    const updated = await this.prisma.staffAttendance.findUnique({
      where: { id: recordId },
      include: { unit: { select: { identifier: true } } },
    });

    this.logger.log(`Staff check-out: ${updated?.staffName}`);
    return updated;
  }

  // ── Today's attendance log for a society (guard view) ─────────────────
  async getTodayLog(societyId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const records = await this.prisma.staffAttendance.findMany({
      where: {
        societyId,
        checkIn: { gte: startOfDay },
      },
      orderBy: { checkIn: 'desc' },
      include: {
        unit: { select: { identifier: true } },
        guard: { select: { name: true } },
      },
    });

    const active = records.filter((r) => !r.checkOut).length;

    return { records, activeCount: active };
  }

  // ── Full attendance log with filters (committee view) ─────────────────
  async getAttendanceLog(
    societyId: string,
    page = 1,
    limit = 20,
    dateFrom?: string,
    dateTo?: string,
    staffType?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { societyId };

    if (dateFrom || dateTo) {
      where.checkIn = {};
      if (dateFrom) (where.checkIn as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.checkIn as Record<string, unknown>).lte = new Date(dateTo);
    }

    if (staffType) {
      where.staffType = staffType;
    }

    const [records, total] = await Promise.all([
      this.prisma.staffAttendance.findMany({
        where,
        orderBy: { checkIn: 'desc' },
        skip,
        take: limit,
        include: {
          unit: { select: { identifier: true } },
          guard: { select: { name: true } },
        },
      }),
      this.prisma.staffAttendance.count({ where }),
    ]);

    return { records, total, page, limit };
  }
}
