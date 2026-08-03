// src/lib/auth.ts

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('xecoflow_token');
}

export function setToken(token: string): void {
  localStorage.setItem('xecoflow_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('xecoflow_token');
  localStorage.removeItem('merchant');
}

export function getStoredMerchant(): any {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('merchant');
  return data ? JSON.parse(data) : null;
}