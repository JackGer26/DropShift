import { api } from './api';

const TOKEN_KEY = 'sd_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export async function login(username: string, password: string): Promise<void> {
  const res = await api.post<{ success: boolean; token: string }>('/auth/login', {
    username,
    password,
  });
  setToken(res.data.token);
}

export function logout(): void {
  clearToken();
}
