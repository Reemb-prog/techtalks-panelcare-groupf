import type { Role } from "@/types";

export type NavIcon = "dashboard" | "customers" | "systems" | "maintenance" | "dispatch" | "jobs";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

/** Coordinator routes. Screens other than the dashboard are owned by PC-S1-06 (registry) and PC-S1-07 (maintenance, dispatch). */
export const COORDINATOR_NAV: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Customers", href: "/customers", icon: "customers" },
  { label: "Systems", href: "/systems", icon: "systems" },
  { label: "Maintenance", href: "/maintenance", icon: "maintenance" },
  { label: "Dispatch", href: "/jobs", icon: "dispatch" },
];

/** Technician routes are owned by PC-S1-08. */
export const TECHNICIAN_NAV: readonly NavItem[] = [{ label: "My jobs", href: "/technician", icon: "jobs" }];

export function navFor(role: Role): readonly NavItem[] {
  return role === "coordinator" ? COORDINATOR_NAV : TECHNICIAN_NAV;
}

/** Where a role lands after sign-in and where "return to permitted work" points. */
export function roleHome(role: Role): string {
  return role === "coordinator" ? "/dashboard" : "/technician";
}

/** True when `pathname` is the item's route or one of its child routes (e.g. /customers/123 → Customers). */
export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return path === href || path.startsWith(href + "/");
}

export const ROLE_LABEL: Record<Role, string> = { coordinator: "Coordinator", technician: "Technician" };
