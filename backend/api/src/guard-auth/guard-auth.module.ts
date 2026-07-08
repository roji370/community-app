import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GuardAuthController } from './guard-auth.controller';
import { GuardAuthService } from './guard-auth.service';
import { GuardJwtStrategy } from './strategies/guard-jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GuardAuthController],
  providers: [GuardAuthService, GuardJwtStrategy],
  exports: [GuardAuthService, GuardJwtStrategy],
})
export class GuardAuthModule {}
