import { apiFetch } from './api';

// ── Dashboard ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  return apiFetch('/committee/dashboard');
}

// ── Visitors ───────────────────────────────────────────────────────────

interface VisitorQuery {
  page?: number;
  limit?: number;
  status?: string;
  unitId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getVisitors(query: VisitorQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.unitId) params.set('unitId', query.unitId);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  const qs = params.toString();
  return apiFetch(`/committee/visitors${qs ? `?${qs}` : ''}`);
}

// ── Complaints ─────────────────────────────────────────────────────────

interface ComplaintQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  unitId?: string;
}

export async function getComplaints(query: ComplaintQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  if (query.category) params.set('category', query.category);
  if (query.unitId) params.set('unitId', query.unitId);
  const qs = params.toString();
  return apiFetch(`/committee/complaints${qs ? `?${qs}` : ''}`);
}

export async function updateComplaintStatus(id: string, newStatus: string) {
  return apiFetch(`/committee/complaints/${id}/status`, {
    method: 'PATCH',
    body: { newStatus },
  });
}

// ── Billing ────────────────────────────────────────────────────────────

interface BillingQuery {
  page?: number;
  limit?: number;
  status?: string;
  unitId?: string;
}

export async function getBills(query: BillingQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.unitId) params.set('unitId', query.unitId);
  const qs = params.toString();
  return apiFetch(`/committee/billing${qs ? `?${qs}` : ''}`);
}

export async function getBillingOverview() {
  return apiFetch('/committee/billing/overview');
}

// ── Notices ────────────────────────────────────────────────────────────

export async function getNotices(page = 1, limit = 20) {
  return apiFetch(`/committee/notices?page=${page}&limit=${limit}`);
}

export async function createNotice(data: {
  title: string;
  body: string;
  requiresAcknowledgment?: boolean;
}) {
  return apiFetch('/committee/notices', {
    method: 'POST',
    body: data,
  });
}
