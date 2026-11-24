import { api, apiBlob } from "./api";
import type { AdminAccount, AdminStats, AdminTeam, Announcement, CheckIn, OutboxStats, Status, User } from "@/types";

export const adminApi = {
  stats: () => api<AdminStats>("/admin/stats"),
  users: (status = "all", q = "") => api<User[]>(`/admin/users?status=${status}&q=${encodeURIComponent(q)}`),
  setStatus: (id: string, status: Status) => api<User>(`/admin/users/${id}/status`, "PATCH", { status }),
  teams: () => api<AdminTeam[]>("/admin/teams"),
  addAnnouncement: (text: string) => api<Announcement>("/admin/announcements", "POST", { text }),
  deleteAnnouncement: (id: number) => api<void>(`/admin/announcements/${id}`, "DELETE"),
  setCapacity: (capacity: number) => api<AdminStats>("/admin/capacity", "PUT", { capacity }),
  admins: () => api<AdminAccount[]>("/admin/admins"),
  addAdmin: (name: string, email: string, password: string) => api<AdminAccount>("/admin/admins", "POST", { name, email, password }),
  removeAdmin: (id: string) => api<void>(`/admin/admins/${id}`, "DELETE"),
  checkIn: (code: string) => api<CheckIn>("/admin/checkin", "POST", { code }),
  undoCheckIn: (ticket: string) => api<void>(`/admin/checkin/${ticket}`, "DELETE"),
  outbox: () => api<OutboxStats>("/admin/outbox"),
  retryOutbox: () => api<OutboxStats>("/admin/outbox/retry", "POST", {}),
  async downloadCsv() {
    const url = URL.createObjectURL(await apiBlob("/admin/export.csv"));
    Object.assign(document.createElement("a"), { href: url, download: "participants.csv" }).click();
    URL.revokeObjectURL(url);
  },
};
