/// <reference types="vite/client" />

/**
 * API Service helper for Job Portal frontend.
 * Configured so that in production/Vercel environments, relative paths (e.g. '/api/auth/register') are used,
 * preventing hardcoded localhost or origin issues.
 */

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL.replace(/\/+$/, '')}${cleanEndpoint}`;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('job_portal_auth_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error(`Network connection failure for ${url}:`, netErr);
    throw new Error('Unable to connect to server. Please check your network connection.');
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text ? { error: text } : null;
  }

  if (!response.ok) {
    const errorMessage =
      data && typeof data === 'object' && data.error
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}
