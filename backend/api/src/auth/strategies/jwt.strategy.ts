import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'jwt-secret-dev',
    });
  }

  /**
   * Called after JWT is verified. Attaches user to request object.
   * Returns the user record or throws if not found/offboarded.
   */
  async validate(payload: { sub: string; phone: string; isOnboarding?: boolean }) {
    // Onboarding tokens don't have a user yet
    if (payload.isOnboarding) {
      return { phone: payload.phone, isOnboarding: true };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        unit: { include: { society: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'OFFBOARDED') {
      throw new UnauthorizedException('Account has been deactivated');
    }

    return user;
  }
}
