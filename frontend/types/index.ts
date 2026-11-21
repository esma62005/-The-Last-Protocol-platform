export type Status = "pending" | "accepted" | "rejected";
export type Track = "AI" | "Cybersecurity" | "Web & Mobile" | "Startup & Impact";
export const TRACKS: Track[] = ["AI", "Cybersecurity", "Web & Mobile", "Startup & Impact"];

export interface User {
  id: string; name: string; email: string; role: "participant" | "admin"; status: Status;
  phone: string; university: string; field_of_study: string; level: string; skills: string;
  experience: string; track: Track; participation_type: string; submission_url: string;
  team_id: string | null; created_at: string;
}
export interface RegisterPayload {
  name: string; email: string; password: string; phone: string; university: string; field_of_study: string;
  level: string; skills: string; experience: string; github: string; portfolio: string;
  participation_type: "Individual" | "Team"; track: Track; motivation: string;
  previous_hackathons: string; special_requirements: string; accept_rules: boolean;
}
export interface Token { access_token: string; role: string; user_id: string }
export interface Member { id: string; name: string; status: Status }
export interface Team { id: string; name: string; code: string; lead_id: string | null; members: Member[] }
export interface Announcement { id: number; text: string; created_at: string }
export interface PublicStats { capacity: number; taken: number }
export interface AdminStats {
  total: number; accepted: number; pending: number; rejected: number; capacity: number;
  seats_left: number; by_track: Record<string, number>; teams: number;
}
export interface AdminTeam { id: string; name: string; code: string; size: number; lead_name: string | null }
