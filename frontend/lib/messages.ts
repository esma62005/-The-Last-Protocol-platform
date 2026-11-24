import type { Status } from "@/types";

export const MESSAGES: Record<Status, string> = {
  pending: "Your application is under review. You will also receive the decision on your Gmail.",
  accepted: "Accepted! See you on Tuesday 15 December at 08:30 — Auditorium of the SNV Faculty.",
  rejected: "Unfortunately your team was not retained for this edition. Thank you for applying.",
};
