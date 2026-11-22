/**
 * MOCK sign-in persistence for S1 (PC-S1-05). Keeps the chosen demo role and mock data scenario in sessionStorage, so a
 * reload or a move between route groups keeps the tab "signed in". This is UI convenience only and NOT authentication:
 * in S2 the server derives the session and role, and the client never supplies its own role.
 */
// Relative imports: vitest.config.ts has no "@/" alias, and unit tests load this module.
import { MOCK_SCENARIOS, type MockControls, type MockScenario } from "../../lib/adapters";
import { ROLES, type Role, type Session } from "../../types";

export const MOCK_ROLE_KEY = "panelcare.mock.role";
export const MOCK_SCENARIO_KEY = "panelcare.mock.scenario";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isRole = (value: unknown): value is Role => typeof value === "string" && (ROLES as readonly string[]).includes(value);
const isScenario = (value: unknown): value is MockScenario =>
  typeof value === "string" && (MOCK_SCENARIOS as readonly string[]).includes(value);

/** The tab's sessionStorage, or null when unavailable (server render, blocked storage, private mode). */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function read(storage: StorageLike | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(storage: StorageLike | null, key: string, value: string | null): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Storage full or blocked: the mock session simply does not survive a reload.
  }
}

/** Stored demo role; an unknown or tampered value is cleared and treated as signed out. */
export function readMockRole(storage: StorageLike | null): Role | null {
  const value = read(storage, MOCK_ROLE_KEY);
  if (value === null) return null;
  if (isRole(value)) return value;
  write(storage, MOCK_ROLE_KEY, null);
  return null;
}

export function writeMockRole(storage: StorageLike | null, role: Role | null): void {
  write(storage, MOCK_ROLE_KEY, role);
}

/** Stored mock data scenario; defaults to "ok", and an unknown value is cleared. */
export function readMockScenario(storage: StorageLike | null): MockScenario {
  const value = read(storage, MOCK_SCENARIO_KEY);
  if (value === null) return "ok";
  if (isScenario(value)) return value;
  write(storage, MOCK_SCENARIO_KEY, null);
  return "ok";
}

export function writeMockScenario(storage: StorageLike | null, scenario: MockScenario): void {
  write(storage, MOCK_SCENARIO_KEY, scenario === "ok" ? null : scenario);
}

/**
 * Applies the stored scenario and demo role to a fresh mock adapter set. Returns the restored session, or null when
 * signed out. A role with no active demo profile clears the stored role instead of throwing.
 */
export function restoreMockSession(storage: StorageLike | null, controls: MockControls): Session | null {
  controls.setScenario(readMockScenario(storage));
  const role = readMockRole(storage);
  if (!role) return null;
  try {
    return controls.signInAs(role);
  } catch {
    writeMockRole(storage, null);
    return null;
  }
}
