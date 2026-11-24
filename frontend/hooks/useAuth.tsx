"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { csrfStore } from "@/services/api";
import { authApi } from "@/services/auth";
import type { RegisterPayload, User } from "@/types";

interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, pw: string) => Promise<string>;
  register: (d: RegisterPayload) => Promise<void>;
  logout: () => void; refresh: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      if (!csrfStore.get()) csrfStore.set((await authApi.session()).csrf_token); // after a reload: recover CSRF from the cookie session
      setUser(await authApi.me());
    } catch { csrfStore.clear(); setUser(null); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, pw: string) => {
    const t = await authApi.login(email, pw);
    csrfStore.set(t.csrf_token);
    await refresh();
    return t.role;
  };
  const register = async (d: RegisterPayload) => {
    csrfStore.set((await authApi.register(d)).csrf_token);
    await refresh();
  };
  const logout = () => { authApi.logout().catch(() => {}); csrfStore.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

/** Redirects to /login when logged out (and away from /admin for non-admins). */
export function useRequireAuth(role?: "admin") {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) router.replace("/login");
    else if (role === "admin" && auth.user.role !== "admin") router.replace("/dashboard");
    else if (!role && auth.user.role === "admin") router.replace("/admin");
  }, [auth.loading, auth.user, role, router]);
  return auth;
}
