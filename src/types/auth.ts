import type { IsoDateTime, Role, Uuid } from "./common";

/** A user profile. Linked 1:1 to a Supabase Auth identity in S2. */
export interface Profile {
  id: Uuid;
  displayName: string;
  email: string;
  role: Role;
  active: boolean;
}

/** The signed-in caller. Real adapters derive it on the server; the client never supplies its own role. */
export interface Session {
  userId: Uuid;
  displayName: string;
  role: Role;
  /** When the session stops being valid. */
  expiresAt: IsoDateTime;
}

export interface SignInRequest {
  email: string;
  password: string;
}

/** Minimal technician info used by dispatch assignment (GET /api/technicians, coordinator only). */
export interface TechnicianSummary {
  id: Uuid;
  displayName: string;
  active: boolean;
}
