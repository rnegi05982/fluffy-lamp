const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface Envelope<T> {
  data?: T;
  meta?: PageMeta;
  error?: { code: string; message: string; details?: unknown };
}

async function call<T>(path: string, options?: RequestInit): Promise<Envelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !json) {
    const err = json?.error;
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? 'Request failed', err?.details);
  }
  return json;
}

/** Returns the `data` payload. */
export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const json = await call<T>(path, options);
  return json.data as T;
}

/** Returns a paginated list payload with its meta. */
export async function requestList<T>(
  path: string,
  options?: RequestInit,
): Promise<{ items: T[]; meta: PageMeta }> {
  const json = await call<T[]>(path, options);
  return { items: (json.data ?? []) as T[], meta: json.meta as PageMeta };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getList: <T>(path: string) => requestList<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function getApiErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
}
