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
}
