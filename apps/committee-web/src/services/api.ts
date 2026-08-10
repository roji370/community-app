const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('committee_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    // Token expired — redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('committee_token');
      localStorage.removeItem('committee_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || json.error || 'Request failed');
  }

  return json.data ?? json;
}
