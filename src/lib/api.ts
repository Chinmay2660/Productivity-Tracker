export class ApiError extends Error {}

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error || `Request failed with status ${res.status}`);
  }
  return body.data as T;
}

const fetchOpts = { credentials: "include" as RequestCredentials };

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { ...fetchOpts, cache: "no-store" });
  return handle<T>(res);
}

export async function apiPost<T>(url: string, payload?: unknown): Promise<T> {
  const res = await fetch(url, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  return handle<T>(res);
}

export async function apiPatch<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    ...fetchOpts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<T>(res);
}

export async function apiPut<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    ...fetchOpts,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<T>(res);
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { ...fetchOpts, method: "DELETE" });
  return handle<T>(res);
}
