import { api } from "./api";
import type { Team } from "@/types";

export const teamsApi = {
  mine: () => api<Team | null>("/teams/me"),
  create: (name: string) => api<Team>("/teams", "POST", { name }),
  join: (code: string) => api<Team>("/teams/join", "POST", { code }),
  leave: () => api<void>("/teams/leave", "POST"),
};
