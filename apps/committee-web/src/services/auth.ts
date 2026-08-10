import { apiFetch } from './api';

export async function requestOtp(phone: string) {
  return apiFetch<{ message: string }>('/auth/otp/request', {
    method: 'POST',
    body: { phone },
  });
}

export async function verifyOtp(phone: string, code: string) {
  return apiFetch<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      phone: string;
      role: string;
      status: string;
      unitId: string | null;
      societyId: string | null;
    };
    isNewUser: boolean;
  }>('/auth/otp/verify', {
    method: 'POST',
    body: { phone, code },
  });
}

export function setAuth(token: string, user: Record<string, unknown>) {
  localStorage.setItem('committee_token', token);
  localStorage.setItem('committee_user', JSON.stringify(user));
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('committee_user');
  return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('committee_token');
}

export function logout() {
  localStorage.removeItem('committee_token');
  localStorage.removeItem('committee_user');
  window.location.href = '/login';
}
