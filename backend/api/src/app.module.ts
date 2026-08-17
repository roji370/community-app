import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GuardAuthModule } from './guard-auth/guard-auth.module';
import { VisitorsModule } from './visitors/visitors.module';
import { GatewayModule } from './gateway/gateway.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BillingModule } from './billing/billing.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { CommitteeModule } from './committee/committee.module';
import { StaffAttendanceModule } from './staff-attendance/staff-attendance.module';

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
    BillingModule,
    ComplaintsModule,
    CommitteeModule,
    StaffAttendanceModule,
  ],
})
export class AppModule {}
