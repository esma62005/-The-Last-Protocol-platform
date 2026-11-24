import { api } from "./api";
import type { Team } from "@/types";

export const teamsApi = {
  mine: () => api<Team | null>("/teams/me"),
  setSubmission: (url: string) => api<Team>("/teams/me/submission", "PUT", { url }),
};
