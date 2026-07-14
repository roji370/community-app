import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { BillStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
  ) {}

  // ── List bills for a unit ─────────────────────────────────────────────
  async getBillsForUnit(
    unitId: string,
    page = 1,
    limit = 20,
    status?: BillStatus,
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { unitId };
    if (status) where.status = status;

    const [bills, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        orderBy: { dueDate: 'desc' },
        skip,
        take: limit,
        include: {
          unit: { select: { identifier: true } },
          society: { select: { name: true } },
        },
      }),
      this.prisma.bill.count({ where }),
    ]);

    return { bills, total, page, limit };
  }

  // ── Dashboard summary for a unit ──────────────────────────────────────
  async getBillingSummary(unitId: string) {
    const now = new Date();

    // Total pending + overdue amount
    const pendingBills = await this.prisma.bill.findMany({
      where: {
        unitId,
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      select: { amountDue: true, amountPaid: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
    });

    const totalDue = pendingBills.reduce(
      (sum, b) => sum + (b.amountDue - b.amountPaid),
      0,
    );

    const nextDueDate = pendingBills.length > 0 ? pendingBills[0].dueDate : null;

    // Total paid this financial year (April to March)
    const fyStart = new Date(
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1,
      3, // April
      1,
    );

    const paidResult = await this.prisma.bill.aggregate({
      where: {
        unitId,
        status: 'PAID',
        paidAt: { gte: fyStart },
      },
      _sum: { amountPaid: true },
    });

    const totalPaidThisYear = paidResult._sum.amountPaid || 0;

    const pendingCount = pendingBills.length;

    return {
      totalDue,
      nextDueDate,
      totalPaidThisYear,
      pendingCount,
    };
  }

  // ── Single bill detail ────────────────────────────────────────────────
  async getBillById(billId: string, unitId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: {
        unit: { select: { identifier: true } },
        society: { select: { name: true } },
      },
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.unitId !== unitId) {
      throw new ForbiddenException('This bill does not belong to your unit');
    }

    return bill;
  }

  // ── Initiate payment (Razorpay order) ─────────────────────────────────
  async initiatePayment(billId: string, unitId: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.unitId !== unitId) {
      throw new ForbiddenException('This bill does not belong to your unit');
    }
    if (bill.status === 'PAID') {
      throw new BadRequestException('This bill has already been paid');
    }

    const amountRemaining = bill.amountDue - bill.amountPaid;
    const amountInPaise = Math.round(amountRemaining * 100);

    const { order, keyId, isMock } = await this.razorpayService.createOrder(
      amountInPaise,
      `bill_${billId}`,
      {
        billId,
        unitId,
        userId,
      },
    );

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: order.currency,
      keyId,
      isMock,
      billId,
      description: `Maintenance Bill - ${bill.dueDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
    };
  }

  // ── Verify payment and mark bill as PAID ──────────────────────────────
  async verifyPayment(
    billId: string,
    unitId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.unitId !== unitId) {
      throw new ForbiddenException('This bill does not belong to your unit');
    }
    if (bill.status === 'PAID') {
      throw new BadRequestException('This bill has already been paid');
    }

    // Verify signature
    const isValid = this.razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      throw new BadRequestException('Payment verification failed — invalid signature');
    }

    // Update bill to PAID
    const updatedBill = await this.prisma.bill.update({
      where: { id: billId },
      data: {
        status: 'PAID',
        amountPaid: bill.amountDue,
        paymentId: razorpayPaymentId,
        paidAt: new Date(),
        receiptUrl: `receipt://${billId}/${razorpayPaymentId}`,
      },
      include: {
        unit: { select: { identifier: true } },
        society: { select: { name: true } },
      },
    });

    this.logger.log(
      `Bill ${billId} paid via ${this.razorpayService.mockMode ? 'MOCK' : 'Razorpay'} — paymentId: ${razorpayPaymentId}`,
    );

    return updatedBill;
  }

  // ── Scheduled: mark overdue bills daily ───────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueBills() {
    const now = new Date();

    const result = await this.prisma.bill.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} bill(s) as OVERDUE`);
    }
  }
}
