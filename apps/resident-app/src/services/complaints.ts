import api from './api';

export interface Complaint {
  id: string;
  unitId: string;
  societyId: string;
  createdByUserId: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'SECURITY' | 'COMMON_AREA' | 'OTHER';
  description: string;
  photoUrls: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED';
  slaDueAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  reopenedAt: string | null;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
  unit?: { identifier: string };
  createdByUser?: { name: string };
  sla: {
    slaDueAt: string;
    remainingMs: number | null;
    isBreached: boolean;
    resolvedWithinSla: boolean | null;
    status: 'ON_TRACK' | 'CRITICAL' | 'BREACHED' | 'RESOLVED_WITHIN_SLA' | 'RESOLVED_AFTER_SLA';
  };
}

export interface ComplaintsSummary {
  openCount: number;
  breachedCount: number;
  resolvedThisMonth: number;
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateComplaintData {
  category: Complaint['category'];
  description: string;
  priority?: Complaint['priority'];
  photoUrls?: string[];
}

export async function getComplaints(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ComplaintsResponse> {
  const response = await api.get('/complaints', { params });
  return response.data.data;
}

export async function getComplaintsSummary(): Promise<ComplaintsSummary> {
  const response = await api.get('/complaints/summary');
  return response.data.data;
}

export async function getComplaintDetail(id: string): Promise<Complaint> {
  const response = await api.get(`/complaints/${id}`);
  return response.data.data;
}

export async function createComplaint(data: CreateComplaintData): Promise<Complaint> {
  const response = await api.post('/complaints', data);
  return response.data.data;
}

export async function reopenComplaint(id: string, reason?: string): Promise<Complaint> {
  const response = await api.patch(`/complaints/${id}/reopen`, { reason });
  return response.data.data;
}
