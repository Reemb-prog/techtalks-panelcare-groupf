"use client";

/**
 * Shared data access for S1 screens (PC-S1-05). Holds ONE mock adapter set per mount and the mock demo session.
 *
 *   const { adapters, auth, dataVersion } = useAdapters();
 *   useEffect(() => { adapters.registry.listCustomers().then(...) }, [adapters, dataVersion]);
 *
 * Screens call only `adapters` (the same interfaces the S2 real adapters implement) and re-fetch when `dataVersion`
 * changes (the mock scenario was switched). Only this file touches the mock `controls`. MOCKS ARE NOT SECURITY.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createMockAdapters, type MockScenario } from "@/lib/adapters";
import type { Adapters, Role, Session } from "@/types";
import { browserStorage, restoreMockSession, writeMockRole, writeMockScenario } from "./mock-session";

export type MockAuthState = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; session: Session };

export interface AdaptersContextValue {
  adapters: Adapters;
  auth: MockAuthState;
  /** Mock data scenario (ok, empty, slow, error, denied). Dev/demo only. */
  scenario: MockScenario;
  setScenario(scenario: MockScenario): void;
  /** Increments when the data source changes; include it in data-fetching effect dependencies. */
  dataVersion: number;
  /** MOCK: starts a demo session for the role. Not authentication. */
  signInAs(role: Role): Session;
  signOut(): void;
}

const AdaptersContext = createContext<AdaptersContextValue | null>(null);

export function AdaptersProvider({ children }: { children: ReactNode }) {
  const [{ adapters, controls }] = useState(() => createMockAdapters());
  const [auth, setAuth] = useState<MockAuthState>({ status: "loading" });
  const [scenario, setScenarioState] = useState<MockScenario>("ok");
  const [dataVersion, setDataVersion] = useState(0);

  // Restore after mount: sessionStorage does not exist during the server render.
  useEffect(() => {
    const storage = browserStorage();
    const session = restoreMockSession(storage, controls);
    setScenarioState(controls.getScenario());
    setAuth(session ? { status: "signed-in", session } : { status: "signed-out" });
  }, [controls]);

  const setScenario = useCallback(
    (next: MockScenario) => {
      controls.setScenario(next);
      writeMockScenario(browserStorage(), next);
      setScenarioState(next);
      setDataVersion((value) => value + 1);
    },
    [controls],
  );

  const signInAs = useCallback(
    (role: Role) => {
      const session = controls.signInAs(role);
      writeMockRole(browserStorage(), role);
      setAuth({ status: "signed-in", session });
      return session;
    },
    [controls],
  );

  const signOut = useCallback(() => {
    controls.signOut();
    writeMockRole(browserStorage(), null);
    setAuth({ status: "signed-out" });
  }, [controls]);

  const value = useMemo(
    () => ({ adapters, auth, scenario, setScenario, dataVersion, signInAs, signOut }),
    [adapters, auth, scenario, setScenario, dataVersion, signInAs, signOut],
  );
  return <AdaptersContext.Provider value={value}>{children}</AdaptersContext.Provider>;
}

export function useAdapters(): AdaptersContextValue {
  const value = useContext(AdaptersContext);
  if (!value) throw new Error("useAdapters() must be used inside <AdaptersProvider>.");
  return value;
}
