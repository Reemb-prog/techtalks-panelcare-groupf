import type { IsoDateTime, Uuid } from "./common";

/**
 * P1 ONLY: typed for future reference, not implemented in the MVP.
 * No adapter, route or screen may use this until the lead accepts fault tickets into scope.
 */
export const FAULT_TICKET_PRIORITIES = ["low", "medium", "high"] as const;
export const FAULT_TICKET_STATUSES = ["open", "in_progress", "resolved"] as const;

export interface FaultTicket {
  id: Uuid;
  systemId: Uuid;
  description: string;
  priority: (typeof FAULT_TICKET_PRIORITIES)[number];
  status: (typeof FAULT_TICKET_STATUSES)[number];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
