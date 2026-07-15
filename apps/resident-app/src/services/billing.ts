import api from './api';

export interface Bill {
  id: string;
  unitId: string;
  societyId: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  breakdown: Array<{ label: string; amount: number }>;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paymentId: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  unit?: { identifier: string };
  society?: { name: string };
}

export interface BillingSummary {
  totalDue: number;
  nextDueDate: string | null;
  totalPaidThisYear: number;
  pendingCount: number;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isMock: boolean;
  billId: string;
  description: string;
}

export interface BillsResponse {
  bills: Bill[];
  total: number;
  page: number;
  limit: number;
}

export async function getBills(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<BillsResponse> {
  const response = await api.get('/billing', { params });
  return response.data.data;
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const response = await api.get('/billing/summary');
  return response.data.data;
}

export async function getBillDetail(id: string): Promise<Bill> {
  const response = await api.get(`/billing/${id}`);
  return response.data.data;
}

export async function initiatePayment(billId: string): Promise<PaymentOrder> {
  const response = await api.post(`/billing/${billId}/pay`);
  return response.data.data;
}

export async function verifyPayment(
  billId: string,
  data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
): Promise<Bill> {
  const response = await api.post(`/billing/${billId}/verify`, data);
  return response.data.data;
}
