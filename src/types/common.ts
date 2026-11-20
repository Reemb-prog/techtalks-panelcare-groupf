/**
 * Shared primitives for the PanelCare contract (PC-S1-03).
 * Frozen at PC-S1-03 merge; changes need a CR in docs/DECISIONS.md.
 */

/** RFC 4122 UUID string. */
export type Uuid = string;

/** Calendar date without time or timezone, "YYYY-MM-DD". Service occurrences use this. */
export type IsoDate = string;

/** UTC instant, ISO 8601 with "Z", e.g. "2026-11-20T08:30:00.000Z". Audit timestamps use this. */
export type IsoDateTime = string;

export const ROLES = ["coordinator", "technician"] as const;
export type Role = (typeof ROLES)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Query parameters accepted by every list endpoint. Pages are 1-based. */
export interface ListQuery {
  page?: number;
  pageSize?: number;
  /** Free-text search; each endpoint documents which fields it matches. */
  q?: string;
  sortDirection?: SortDirection;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Business timezones accepted by maintenance plans. D05: Asia/Beirut only for the MVP. */
export const BUSINESS_TIMEZONES = ["Asia/Beirut"] as const;
export type BusinessTimezone = (typeof BUSINESS_TIMEZONES)[number];
export const DEFAULT_BUSINESS_TIMEZONE: BusinessTimezone = "Asia/Beirut";
