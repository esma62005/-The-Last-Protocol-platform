export type Status = "pending" | "accepted" | "rejected";

export interface Team { id: string; name: string; lead_id: string | null; member_emails: string[] }
export interface User {
  id: string; name: string; email: string; role: "participant" | "admin"; status: Status;
  university: string; field_of_study: string; level: string; skills: string;
  experience: string; submission_url: string; team_id: string | null; team: Team | null;
  checked_in_at: string | null; created_at: string;
}
/** A whole team registers at once: leader (account owner) + 2 to 4 other members identified by Gmail. */
export interface RegisterPayload {
  team_name: string; name: string; email: string; password: string; university: string;
  field_of_study: string; level: string; member_emails: string[];
  skills: string; experience: string; github: string; portfolio: string;
  motivation: string; previous_hackathons: string; special_requirements: string; accept_rules: boolean;
}
export interface Token { role: string; user_id: string; csrf_token: string }
export interface Announcement { id: number; text: string; created_at: string }
export interface PublicStats { capacity: number; taken: number }
export interface AdminStats {
  total: number; accepted: number; pending: number; rejected: number; capacity: number;
  seats_left: number; participants: number; by_size: Record<string, number>; teams: number; checked_in: number;
}
export interface AdminTeam { id: string; name: string; size: number; lead_name: string | null; lead_email: string | null; member_emails: string[] }
export interface AdminAccount { id: string; name: string; email: string; created_at: string }
export interface CheckIn {
  ticket: string; team_name: string; leader_name: string; size: number; member_emails: string[];
  status: Status; checked_in_at: string; already_checked_in: boolean;
}
export interface OutboxStats { pending: number; sent: number; failed: number }
