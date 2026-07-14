import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { RazorpayService } from './razorpay.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [BillingController],
  providers: [BillingService, RazorpayService],
  exports: [BillingService],
})
export class BillingModule {}
