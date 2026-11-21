import { api, apiBlob } from "./api";
import type { AdminStats, AdminTeam, Announcement, Status, User } from "@/types";

export const adminApi = {
  stats: () => api<AdminStats>("/admin/stats"),
  users: (status = "all", q = "") => api<User[]>(`/admin/users?status=${status}&q=${encodeURIComponent(q)}`),
  setStatus: (id: string, status: Status) => api<User>(`/admin/users/${id}/status`, "PATCH", { status }),
  teams: () => api<AdminTeam[]>("/admin/teams"),
  addAnnouncement: (text: string) => api<Announcement>("/admin/announcements", "POST", { text }),
  deleteAnnouncement: (id: number) => api<void>(`/admin/announcements/${id}`, "DELETE"),
  setCapacity: (capacity: number) => api<AdminStats>("/admin/capacity", "PUT", { capacity }),
  async downloadCsv() {
    const url = URL.createObjectURL(await apiBlob("/admin/export.csv"));
    Object.assign(document.createElement("a"), { href: url, download: "participants.csv" }).click();
    URL.revokeObjectURL(url);
  },
};
