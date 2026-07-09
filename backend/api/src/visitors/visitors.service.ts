import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { FcmService } from '../notifications/fcm.service';
import { CreateVisitorDto, ResolveVisitorDto } from './dto/visitors.dto';
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
