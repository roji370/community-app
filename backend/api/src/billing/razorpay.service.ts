import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string | undefined;
  private readonly keySecret: string | undefined;
  private readonly isMockMode: boolean;

  constructor(private configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    this.isMockMode = !this.keyId || !this.keySecret;

    if (this.isMockMode) {
      this.logger.warn(
        'Razorpay keys not configured — running in MOCK payment mode. ' +
        'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to enable real payments.',
      );
    } else {
      this.logger.log('Razorpay configured with key: ' + this.keyId);
    }
  }

  /**
   * Creates a Razorpay order. In mock mode, returns a fake order.
   */
  async createOrder(
    amountInPaise: number,
    receipt: string,
    notes?: Record<string, string>,
  ): Promise<{ order: RazorpayOrder; keyId: string; isMock: boolean }> {
    if (this.isMockMode) {
      const mockOrder: RazorpayOrder = {
        id: `mock_order_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        status: 'created',
      };
      return { order: mockOrder, keyId: 'mock_key', isMock: true };
    }

    // Real Razorpay API call
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: notes || {},
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Razorpay order creation failed: ${error}`);
      throw new Error(`Payment order creation failed: ${response.status}`);
    }

    const order = (await response.json()) as RazorpayOrder;
    return { order, keyId: this.keyId!, isMock: false };
  }

  /**
   * Verifies Razorpay payment signature using HMAC-SHA256.
   * In mock mode, always returns true.
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    if (this.isMockMode) {
      this.logger.log(`Mock mode: auto-verifying payment ${paymentId}`);
      return true;
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret!)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /** Returns whether we're in mock (no Razorpay keys) mode */
  get mockMode(): boolean {
    return this.isMockMode;
  }
}
