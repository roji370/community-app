import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface GuardJwtPayload {
  sub: string;
  guardId: string;
  staffId: string;
  societyId: string;
  role: 'GUARD';
}

@Injectable()
export class GuardJwtStrategy extends PassportStrategy(Strategy, 'guard-jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: GuardJwtPayload) {
    if (payload.role !== 'GUARD') return null;

    const guard = await this.prisma.guard.findUnique({
      where: { id: payload.guardId },
    });

    if (!guard || !guard.isActive) return null;
    return { ...payload, guard };
  }
}
