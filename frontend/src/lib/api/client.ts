import { ApiError } from '@/lib/api/client-types';
export { ApiError } from '@/lib/api/client-types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  raw?: boolean; // do not unwrap the { success, data } envelope
}

/**
 * Centralised API client for the Spring Boot backend.
 * Base URL comes from NEXT_PUBLIC_API_BASE (default http://localhost:8080/api/v1).
 * Session cookies are HTTP-only and sent cross-origin via credentials:'include'.
 * Every response uses the envelope { success, data } / { success:false, code, message, fieldErrors };
 * api.* helpers unwrap `data` and throw ApiError(code, fieldErrors) on failure.
 */
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/api/v1';

function withQuery(path: string, query?: RequestOptions['query']): string {
  if (!query) return path;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function apiRequest<T>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const timeoutSignal = AbortSignal.timeout(10000);
  const signal = opts.signal ?? timeoutSignal;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${withQuery(path.startsWith('/') ? path : `/${path}`, opts.query)}`, {
      method,
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(504, 'TIMEOUT', 'Server connection timed out — backend took too long to respond.');
    }
    throw new ApiError(503, 'SERVER_OFFLINE', 'Cannot connect to backend server (http://localhost:8080). Make sure backend is running.');
  }

  let json: unknown = null;
  try { json = await res.json(); } catch { /* empty body */ }

  if (!res.ok || (json && typeof json === 'object' && (json as { success?: boolean }).success === false)) {
    const err = json as { code?: string; message?: string; fieldErrors?: Record<string, string> } | null;
    throw new ApiError(res.status, err?.code ?? 'REQUEST_FAILED', err?.message ?? `Request failed (${res.status})`, err?.fieldErrors);
  }
  if (opts.raw) return json as T;
  return (json as { data: T }).data;
}

/** Binary download (invoice PDFs). Returns the blob + server-suggested filename. */
export async function apiBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    let err: { code?: string; message?: string } | null = null;
    try { err = await res.json(); } catch { /* binary error body */ }
    throw new ApiError(res.status, err?.code ?? 'REQUEST_FAILED', err?.message ?? `Download failed (${res.status})`);
  }
  const cd = res.headers.get('content-disposition') ?? '';
  const m = /filename="?([^";]+)"?/.exec(cd);
  return { blob: await res.blob(), filename: m?.[1] ?? 'download.pdf' };
}

export const api = {
  get: <T>(path: string, o?: Omit<RequestOptions, 'body'>) => apiRequest<T>('GET', path, o),
  post: <T>(path: string, body?: unknown, o?: Omit<RequestOptions, 'body'>) => apiRequest<T>('POST', path, { ...o, body }),
  patch: <T>(path: string, body?: unknown, o?: Omit<RequestOptions, 'body'>) => apiRequest<T>('PATCH', path, { ...o, body }),
  put: <T>(path: string, body?: unknown, o?: Omit<RequestOptions, 'body'>) => apiRequest<T>('PUT', path, { ...o, body }),
  del: <T>(path: string, o?: Omit<RequestOptions, 'body'>) => apiRequest<T>('DELETE', path, o),
};

/** Public URL for a stored media key (product images). 404s fall back to DeviceArt in the UI. */
export const mediaUrl = (key?: string | null): string | null =>
  key ? `${BASE_URL}/media/${key}` : null;
