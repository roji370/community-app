import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardUserDto } from './dto/users.dto';
import { NotificationCategory } from '@community/shared-types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Onboard a new user — link them to a society + unit.
   * Sets status to PENDING_APPROVAL (requires committee admin to approve).
   * Also creates default notification preferences.
   */
  async onboard(phone: string, dto: OnboardUserDto) {
    // Verify society exists
    const society = await this.prisma.society.findUnique({
      where: { id: dto.societyId },
    });
    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // Verify unit exists and belongs to society
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, societyId: dto.societyId },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found in this society');
    }

    // Check if user already exists with this phone
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingUser) {
      throw new BadRequestException('User already registered with this phone number');
    }

    // Create user with PENDING_APPROVAL status
    const user = await this.prisma.user.create({
      data: {
        phone,
        name: dto.name,
        unitId: dto.unitId,
        societyId: dto.societyId,
        role: dto.role || 'OWNER',
        status: 'PENDING_APPROVAL',
      },
      include: {
        unit: { include: { society: true } },
      },
    });

    // Create default notification preferences
    const categories = Object.values(NotificationCategory);
    await this.prisma.notificationPreference.createMany({
      data: categories.map((category) => ({
        userId: user.id,
        category,
        // SECURITY always on, COMMERCIAL always off by default, rest on
        enabled: category === NotificationCategory.COMMERCIAL ? false : true,
      })),
    });

    this.logger.log(
      `New user onboarded: ${user.name} (${user.phone}) → ${society.name} / ${unit.identifier} [PENDING]`,
    );

    return user;
  }

  /**
   * Get current user profile with unit and society details.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        unit: { include: { society: true } },
        notificationPreferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Search societies by name or pincode (for onboarding flow).
   */
  async searchSocieties(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    return this.prisma.society.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { pincode: { startsWith: query } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get units for a society (for onboarding flow unit selection).
   */
  async getUnitsForSociety(societyId: string) {
    const society = await this.prisma.society.findUnique({
      where: { id: societyId },
    });
    if (!society) {
      throw new NotFoundException('Society not found');
    }

    const units = await this.prisma.unit.findMany({
      where: { societyId },
      include: {
        users: {
          where: { status: { not: 'OFFBOARDED' } },
          select: { id: true }, // Just count, don't expose user details
        },
      },
      orderBy: [{ block: 'asc' }, { floor: 'asc' }, { identifier: 'asc' }],
    });

    // Return units with occupancy info (how many active residents)
    return units.map((unit: { id: string; identifier: string; block: string | null; floor: number | null; users: { id: string }[] }) => ({
      id: unit.id,
      identifier: unit.identifier,
      block: unit.block,
      floor: unit.floor,
      residentCount: unit.users.length,
    }));
  }

  /**
   * Check user status (for pending approval polling).
   */
  async checkStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { status: user.status };
  }

  // ── Notification preferences ──────────────────────────────────────────

  async getNotificationPreferences(userId: string) {
    const allCategories = Object.values(NotificationCategory);

    const existing = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const existingMap = new Map(
      existing.map((p) => [p.category, p.enabled]),
    );

    // Return all categories, filling in defaults for any that don't exist yet
    return allCategories.map((category) => ({
      category,
      enabled: existingMap.has(category)
        ? existingMap.get(category)!
        : category === NotificationCategory.COMMERCIAL
          ? false
          : true,
      locked: category === NotificationCategory.SECURITY,
    }));
  }

  async updateNotificationPreference(
    userId: string,
    category: NotificationCategory,
    enabled: boolean,
  ) {
    // SECURITY can never be disabled
    if (category === NotificationCategory.SECURITY && !enabled) {
      throw new BadRequestException(
        'Security notifications cannot be disabled',
      );
    }

    const pref = await this.prisma.notificationPreference.upsert({
      where: {
        userId_category: { userId, category },
      },
      create: { userId, category, enabled },
      update: { enabled },
    });

    this.logger.log(
      `Notification preference updated: ${category} = ${enabled} for user ${userId}`,
    );

    return pref;
  }

  // ── Resident notices ──────────────────────────────────────────────────

  async getNoticesForResident(societyId: string, page = 1, limit = 20) {
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

    return { notices, total, page, limit };
  }

  async acknowledgeNotice(noticeId: string, userId: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) throw new NotFoundException('Notice not found');
    if (!notice.requiresAcknowledgment) {
      throw new BadRequestException('This notice does not require acknowledgment');
    }

    // Atomic: only push if userId is not already in the array.
    // updateMany with a NOT-has filter prevents duplicate entries under concurrency.
    const result = await this.prisma.notice.updateMany({
      where: {
        id: noticeId,
        NOT: {
          acknowledgedByUserIds: { has: userId },
        },
      },
      data: {
        acknowledgedByUserIds: {
          push: userId,
        },
      },
    });

    return {
      acknowledged: true,
      alreadyAcknowledged: result.count === 0,
    };
  }
}
