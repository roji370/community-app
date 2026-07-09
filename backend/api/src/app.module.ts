import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GuardAuthModule } from './guard-auth/guard-auth.module';
import { VisitorsModule } from './visitors/visitors.module';
import { GatewayModule } from './gateway/gateway.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Environment config — validates required vars at startup
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    GuardAuthModule,
    VisitorsModule,
    GatewayModule,
    NotificationsModule,
  ],
})
export class AppModule {}
