import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Mock OTP for development — always accepts "123456"
  private readonly MOCK_OTP = '123456';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Request OTP — generates and "sends" an OTP.
   * In dev mode, uses mock OTP (123456). In production, swap to Twilio.
   */
  async requestOtp(phone: string): Promise<{ message: string; expiresInMinutes: number }> {
    // Rate limiting: max 3 OTPs per phone per 10-minute window
    const windowStart = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await this.prisma.oTPCode.count({
      where: {
        phone,
        createdAt: { gte: windowStart },
      },
    });

    if (recentOtps >= 3) {
      throw new BadRequestException(
        'Too many OTP requests. Please wait 10 minutes before trying again.',
      );
    }

    // Generate OTP code
    const isMock = this.configService.get('OTP_PROVIDER') === 'mock';
    const code = isMock ? this.MOCK_OTP : this.generateOtp();
    const expiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES') || 5;

    // Store OTP
    await this.prisma.oTPCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      },
    });

    // In production: send via Twilio
    if (!isMock) {
      // TODO: Integrate Twilio SMS — this.sendSms(phone, code)
      this.logger.log(`OTP sent to ${phone}`);
    } else {
      this.logger.log(`[MOCK] OTP for ${phone}: ${code}`);
    }

    return {
      message: isMock
        ? `OTP sent (dev mode — use ${this.MOCK_OTP})`
        : 'OTP sent to your phone number',
      expiresInMinutes: expiryMinutes,
    };
  }

  /**
   * Verify OTP and issue JWT tokens.
   * Returns user if exists, or signals new user for onboarding.
   */
  async verifyOtp(phone: string, code: string) {
    // Find latest valid OTP for this phone
    const otpRecord = await this.prisma.oTPCode.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('OTP expired or not found. Please request a new one.');
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      throw new UnauthorizedException(
        'Too many incorrect attempts. Please request a new OTP.',
      );
    }

    // Verify code
    if (otpRecord.code !== code) {
      await this.prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP code.');
    }

    // Mark OTP as verified
    await this.prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        unit: { include: { society: true } },
      },
    });

    if (existingUser) {
      // Existing user — issue tokens
      const tokens = await this.issueTokens(existingUser.id, existingUser.phone);
      return {
        ...tokens,
        user: existingUser,
        isNewUser: false,
      };
    }

    // New user — issue a temporary token scoped to onboarding
    const tempToken = this.jwtService.sign(
      { phone, isOnboarding: true },
      { expiresIn: '1h' },
    );

    return {
      accessToken: tempToken,
      refreshToken: null,
      user: null,
      isNewUser: true,
    };
  }

  /**
   * Issue access + refresh token pair for an authenticated user.
   */
  async issueTokens(userId: string, phone: string) {
    const payload = { sub: userId, phone };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret-dev',
      expiresIn: '30d',
    });

    // Store refresh token in DB for rotation/revocation
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh an expired access token using a valid refresh token.
   */
  async refreshAccessToken(refreshToken: string) {
    // Verify the refresh token
    let payload: { sub: string; phone: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret-dev',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check it exists in DB and isn't revoked
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair
    return this.issueTokens(payload.sub, payload.phone);
  }

  /**
   * Generate a random 6-digit OTP.
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
