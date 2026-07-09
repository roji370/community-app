import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { GatewayModule } from '../gateway/gateway.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    GatewayModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
})
export class VisitorsModule {}
