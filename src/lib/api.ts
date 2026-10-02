export class ApiError extends Error {}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error || `Request failed with status ${res.status}`);
  }
  return body.data as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  return handle<T>(res);
}

export async function apiPost<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<T>(res);
}

export async function apiPatch<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<T>(res);
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  return handle<T>(res);
}
