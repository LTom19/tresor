import type { AppState } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function clearAuthStorage() {
  localStorage.removeItem('tresor-token');
  localStorage.removeItem('tresor-user');
}

export function isApiMode(): boolean {
  return Boolean(API_BASE);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && !path.startsWith('/auth/')) {
    clearAuthStorage();
    window.dispatchEvent(new Event('tresor-auth-expired'));
    throw new Error('Session expirée');
  }

  const contentType = res.headers.get('content-type') ?? '';
  let data: { error?: string } | T | undefined;
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => undefined);
  }
  if (!res.ok) {
    throw new Error((data as { error?: string } | undefined)?.error ?? `Erreur réseau (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  if (data === undefined) throw new Error('Réponse serveur invalide');
  return data as T;
}

export interface AuthResponse {
  user: { id: string; email: string };
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  getState: () => request<AppState>('/state'),

  action: (type: string, payload: Record<string, unknown> = {}) =>
    request<AppState>('/actions', { method: 'POST', body: JSON.stringify({ type, payload }) }),
};
