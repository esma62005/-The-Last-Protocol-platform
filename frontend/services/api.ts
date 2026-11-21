const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem("tlp_token")),
  set: (t: string) => localStorage.setItem("tlp_token", t),
  clear: () => localStorage.removeItem("tlp_token"),
};

async function request(path: string, method = "GET", body?: unknown): Promise<Response> {
  const token = tokenStore.get();
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const d = (await res.json()).detail;
      msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => e.msg).join(" · ") : msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res;
}

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await request(path, method, body);
  return res.status === 204 ? (undefined as T) : res.json();
}

export const apiBlob = async (path: string) => (await request(path)).blob();
