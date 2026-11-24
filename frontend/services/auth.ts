
import { api } from "./api";

import type {
  Announcement,
  PublicStats,
  RegisterPayload,
  Token,
  User,
  TeamStatus,
} from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api<Token>("/auth/login", "POST", { email, password }),

  register: (data: RegisterPayload) =>
    api<Token>("/auth/register", "POST", data),

  session: () => api<Token>("/auth/session"),

  logout: () => api<void>("/auth/logout", "POST"),

  me: () => api<User>("/users/me"),

  setSubmission: (url: string) =>
    api<User>("/users/me/submission", "PUT", { url }),
};

export const publicApi = {
  stats: () => api<PublicStats>("/public/stats"),

  announcements: () =>
    api<Announcement[]>("/public/announcements"),

  status: (email: string, code: string) =>
    api<TeamStatus>("/public/status", "POST", {
      email,
      code,
    }),
};
