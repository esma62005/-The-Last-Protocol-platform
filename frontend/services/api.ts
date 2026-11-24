const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/**
 * The session JWT lives in an HttpOnly cookie set by the API (JavaScript cannot read it, so an XSS cannot steal it).
 * All we keep here is the CSRF value, in memory only: it is sent back in X-CSRF-Token on every state-changing call.
 */
let csrf: string | null = null;
export const csrfStore = {
  get: () => csrf,
  set: (t: string) => { csrf = t; },
  clear: () => { csrf = null; },
};

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

async function request(path: string, method = "GET", body?: unknown): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(!SAFE.has(method) && csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the server (${BASE}). Start the backend (uvicorn app.main:app --reload) and check NEXT_PUBLIC_API_URL.`);
  }
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const d = (await res.json()).detail;
      msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => String(e.msg).replace(/^Value error, /, "")).join(" · ") : msg;
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
