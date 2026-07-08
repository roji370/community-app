import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GuardLoginDto } from './dto/guard-auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class GuardAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: GuardLoginDto) {
    const guard = await this.prisma.guard.findUnique({
      where: { staffId: dto.staffId },
      include: { society: { select: { id: true, name: true } } },
    });

    if (!guard || !guard.isActive) {
      throw new UnauthorizedException('Invalid staff ID or account disabled');
    }

    const pinValid = await bcrypt.compare(dto.pin, guard.pin);
    if (!pinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const payload = {
      sub: guard.id,
      guardId: guard.id,
      staffId: guard.staffId,
      societyId: guard.societyId,
      role: 'GUARD',
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '12h' });

    return {
      accessToken,
      guard: {
        id: guard.id,
        name: guard.name,
        staffId: guard.staffId,
        society: guard.society,
      },
    };
  }
}
