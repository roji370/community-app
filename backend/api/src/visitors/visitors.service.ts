import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { FcmService } from '../notifications/fcm.service';
import { CreateVisitorDto, ResolveVisitorDto, CreatePreApprovedVisitorDto } from './dto/visitors.dto';
import { GuardJwtPayload } from '../guard-auth/strategies/guard-jwt.strategy';

const VISITOR_EXPIRY_MINUTES = 3;

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: EventsGateway,
    private fcmService: FcmService,
  ) {}

  // ── Guard creates a visitor at the gate ──────────────────────────────
  async createGateVisitor(dto: CreateVisitorDto, guard: GuardJwtPayload) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, societyId: guard.societyId },
      include: {
        users: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true },
        },
      },
    });

    if (!unit) throw new NotFoundException('Unit not found in this society');

    const expiresAt = new Date(Date.now() + VISITOR_EXPIRY_MINUTES * 60 * 1000);

    const visitor = await this.prisma.visitor.create({
      data: {
        name: dto.name,
        purpose: dto.purpose,
        purposeNote: dto.purposeNote,
        phone: dto.phone,
        photoUrl: dto.photoUrl,
        unitId: dto.unitId,
        societyId: guard.societyId,
        guardId: guard.guardId,
        createdBy: 'GUARD',
        status: 'PENDING',
        expiresAt,
      },
      include: {
        guard: { select: { id: true, name: true } },
      },
    });

    const guardName = visitor.guard?.name ?? 'Security Guard';

    const pendingPayload = {
      visitorId: visitor.id,
      name: visitor.name,
      purpose: visitor.purpose,
      photoUrl: visitor.photoUrl,
      guardName,
      unitId: visitor.unitId,
      societyId: visitor.societyId,
      expiresAt: expiresAt.toISOString(),
      createdAt: visitor.createdAt.toISOString(),
    };

    // 1. Emit WebSocket event to unit room (resident app open)
    this.gateway.emitVisitorPending(dto.unitId, pendingPayload);

    // 2. Send FCM push to all residents in this unit (app backgrounded)
    await Promise.allSettled(
      unit.users.map((user) =>
        this.fcmService.sendVisitorNotification(user.id, {
          visitorId: visitor.id,
          visitorName: visitor.name,
          purpose: visitor.purpose,
          guardName,
          photoUrl: visitor.photoUrl ?? undefined,
          unitId: visitor.unitId,
          expiresAt: expiresAt.toISOString(),
        }),
      ),
    );

    return visitor;
  }

  // ── Resident approves or denies ──────────────────────────────────────
  async resolveVisitor(
    visitorId: string,
    dto: ResolveVisitorDto,
    residentUserId: string,
  ) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
      include: {
        unit: {
          include: { users: { select: { id: true } } },
        },
        guard: { select: { id: true, name: true } },
      },
    });

    if (!visitor) throw new NotFoundException('Visitor not found');

    // Verify the resident belongs to this unit
    const isResident = visitor.unit.users.some((u) => u.id === residentUserId);
    if (!isResident) throw new ForbiddenException('You are not a resident of this unit');

    if (visitor.status !== 'PENDING') {
      throw new ForbiddenException(
        `Visitor already ${visitor.status.toLowerCase()}`,
      );
    }

    const updatedVisitor = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        status: dto.action === 'APPROVED' ? 'APPROVED' : 'DENIED',
        respondedAt: new Date(),
        respondedByUserId: residentUserId,
      },
      include: {
        respondedByUser: { select: { name: true } },
      },
    });

    // Emit result back to guard via WebSocket
    if (visitor.guardId) {
      this.gateway.emitVisitorResult(visitor.guardId, {
        visitorId,
        status: dto.action,
        residentName: updatedVisitor.respondedByUser?.name,
        resolvedAt: new Date().toISOString(),
      });
    }

    return updatedVisitor;
  }

  // ── Resident fetches their visitor history ───────────────────────────
  async getVisitorHistory(unitId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [visitors, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where: { unitId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          guard: { select: { name: true } },
          respondedByUser: { select: { name: true } },
        },
      }),
      this.prisma.visitor.count({ where: { unitId } }),
    ]);

    return { visitors, total, page, limit };
  }

  // ── Resident pre-approves a visitor ───────────────────────────────────
  async createPreApprovedVisitor(
    dto: CreatePreApprovedVisitorDto,
    userId: string,
    unitId: string,
    societyId: string,
  ) {
    const PRE_APPROVAL_EXPIRY_HOURS = 48;
    const expiresAt = new Date(Date.now() + PRE_APPROVAL_EXPIRY_HOURS * 60 * 60 * 1000);

    // Retry loop: catch unique constraint violations on qrCode (P2002)
    // instead of check-then-create TOCTOU race
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = randomBytes(4).toString('base64url').slice(0, 6).toUpperCase();
      const shareableLink = `https://app.communityapp.in/pass/${code}`;

      try {
        const visitor = await this.prisma.visitor.create({
          data: {
            name: dto.name,
            purpose: dto.purpose,
            phone: dto.phone,
            unitId,
            societyId,
            createdBy: 'RESIDENT',
            createdByUserId: userId,
            status: 'APPROVED',
            entryType: dto.entryType === 'SCHEDULED' ? 'SCHEDULED' : 'ONE_TIME',
            expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
            expiresAt,
            qrCode: code,
            shareableLink,
          },
        });

        this.logger.log(`Pre-approved visitor "${visitor.name}" by user ${userId}, code: ${code}`);

        return {
          id: visitor.id,
          name: visitor.name,
          purpose: visitor.purpose,
          code,
          shareableLink,
          entryType: visitor.entryType,
          expectedAt: visitor.expectedAt,
          expiresAt,
          createdAt: visitor.createdAt,
        };
      } catch (err: any) {
        // P2002 = unique constraint violation (code collision)
        if (err?.code === 'P2002' && err?.meta?.target?.includes('qrCode')) {
          continue; // Retry with a new code
        }
        throw err; // Re-throw non-collision errors
      }
    }

    throw new BadRequestException('Failed to generate unique pass code after retries');
  }

  // ── Guard validates a visitor pass ───────────────────────────────────
  async validateVisitorPass(code: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { qrCode: code.toUpperCase() },
      include: {
        unit: { select: { identifier: true } },
        createdByUser: { select: { name: true } },
      },
    });

    if (!visitor) {
      throw new NotFoundException('Invalid pass code');
    }

    if (visitor.status !== 'APPROVED') {
      throw new BadRequestException(`Pass is ${visitor.status.toLowerCase()}`);
    }

    // Check expiry
    if (visitor.expiresAt && new Date() > visitor.expiresAt) {
      // Mark as expired
      await this.prisma.visitor.update({
        where: { id: visitor.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This pass has expired');
    }

    // Check if scheduled visit has a date and it's not today
    if (visitor.expectedAt) {
      const today = new Date();
      const expected = new Date(visitor.expectedAt);
      const daysDiff = Math.abs(
        (today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff > 1) {
        throw new BadRequestException(
          `This pass is scheduled for ${expected.toLocaleDateString('en-IN')}`,
        );
      }
    }

    // Consume ONE_TIME passes to prevent reuse
    if (visitor.entryType === 'ONE_TIME') {
      await this.prisma.visitor.update({
        where: { id: visitor.id },
        data: { status: 'USED', respondedAt: new Date() },
      });
    }

    return {
      id: visitor.id,
      name: visitor.name,
      purpose: visitor.purpose,
      phone: visitor.phone,
      unit: visitor.unit.identifier,
      approvedBy: visitor.createdByUser?.name ?? 'Resident',
      entryType: visitor.entryType,
      expectedAt: visitor.expectedAt,
      valid: true,
    };
  }

  // ── Scheduled: expire pending visitors after 3 minutes ──────────────
  @Cron(CronExpression.EVERY_30_SECONDS)
  async expirePendingVisitors() {
    const expired = await this.prisma.visitor.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      select: { id: true, unitId: true, guardId: true },
    });

    if (expired.length === 0) return;

    await this.prisma.visitor.updateMany({
      where: { id: { in: expired.map((v) => v.id) } },
      data: { status: 'EXPIRED', respondedAt: new Date() },
    });

    expired.forEach((v) => {
      this.gateway.emitVisitorExpired(v.unitId, v.guardId, v.id);
    });

    this.logger.log(`Expired ${expired.length} pending visitor(s)`);
  }
}
