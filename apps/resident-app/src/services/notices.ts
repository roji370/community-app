import api from './api';

export interface Notice {
  id: string;
  title: string;
  body: string;
  requiresAcknowledgment: boolean;
  acknowledgedByUserIds: string[];
  createdAt: string;
  createdByUser: { name: string };
}

export interface NoticesResponse {
  notices: Notice[];
  total: number;
  page: number;
  limit: number;
}

export async function getNotices(page = 1, limit = 20): Promise<NoticesResponse> {
  const res = await api.get(`/users/me/notices?page=${page}&limit=${limit}`);
  return res.data.data ?? res.data;
}

export async function getLatestNotices(limit = 2): Promise<Notice[]> {
  const data = await getNotices(1, limit);
  return data.notices;
}

export async function acknowledgeNotice(noticeId: string): Promise<void> {
  await api.post(`/users/me/notices/${noticeId}/acknowledge`);
}
