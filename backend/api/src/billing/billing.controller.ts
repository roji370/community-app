import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillQueryDto, VerifyPaymentDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActiveStatusGuard } from '../auth/guards/active-status.guard';

interface ResidentUser {
  id: string;
  unitId: string | null;
  status: string;
}

@Controller('billing')
@UseGuards(JwtAuthGuard, ActiveStatusGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // List bills for the resident's unit
  @Get()
  getBills(
    @Request() req: { user: ResidentUser },
    @Query() query: BillQueryDto,
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return { bills: [], total: 0, page: 1, limit: 20 };

    return this.billingService.getBillsForUnit(
      unitId,
      query.page || 1,
      query.limit || 20,
      query.status,
    );
  }

  // Dashboard summary: total due, next due date, total paid this year
  @Get('summary')
  getSummary(@Request() req: { user: ResidentUser }) {
    const unitId = req.user.unitId;
    if (!unitId) {
      return { totalDue: 0, nextDueDate: null, totalPaidThisYear: 0, pendingCount: 0 };
    }

    return this.billingService.getBillingSummary(unitId);
  }

  // Single bill detail
  @Get(':id')
  getBill(
    @Param('id') id: string,
    @Request() req: { user: ResidentUser },
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return null;

    return this.billingService.getBillById(id, unitId);
  }

  // Initiate Razorpay payment
  @Post(':id/pay')
  initiatePayment(
    @Param('id') id: string,
    @Request() req: { user: ResidentUser },
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return null;

    return this.billingService.initiatePayment(id, unitId, req.user.id);
  }

  // Verify Razorpay payment and mark bill as PAID
  @Post(':id/verify')
  verifyPayment(
    @Param('id') id: string,
    @Body() dto: VerifyPaymentDto,
    @Request() req: { user: ResidentUser },
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return null;

    return this.billingService.verifyPayment(
      id,
      unitId,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
  }
}
