import api from './api';
import type { Society } from '@community/shared-types';

// ── OTP ──────────────────────────────────────────────────────

export async function requestOtp(phone: string) {
  const response = await api.post('/auth/otp/request', { phone });
  return response.data.data as { message: string; expiresInMinutes: number };
}

export async function verifyOtp(phone: string, code: string) {
  const response = await api.post('/auth/otp/verify', { phone, code });
  return response.data.data as {
    accessToken: string;
    refreshToken: string | null;
    user: any | null;
    isNewUser: boolean;
  };
}

// ── Onboarding ───────────────────────────────────────────────

export async function onboardUser(data: {
  name: string;
  societyId: string;
  unitId: string;
  role?: string;
}) {
  const response = await api.post('/users/onboard', data);
  return response.data.data;
}

export async function searchSocieties(query: string): Promise<Society[]> {
  const response = await api.get('/users/societies/search', {
    params: { q: query },
  });
  return response.data.data;
}

export async function getUnitsForSociety(societyId: string) {
  const response = await api.get(`/users/societies/${societyId}/units`);
  return response.data.data as Array<{
    id: string;
    identifier: string;
    block: string | null;
    floor: number | null;
    residentCount: number;
  }>;
}

// ── Profile ──────────────────────────────────────────────────

export async function getProfile() {
  const response = await api.get('/users/me');
  return response.data.data;
}

export async function checkApprovalStatus() {
  const response = await api.get('/users/me/status');
  return response.data.data as { status: string };
}
