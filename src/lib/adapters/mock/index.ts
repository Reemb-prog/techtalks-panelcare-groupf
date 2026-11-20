/**
 * Entry point for S1 mock data. Screens receive `adapters` (the same interfaces as the S2 real adapters)
 * and dev-only `controls` to switch scenarios and simulated users.
 *
 *   const { adapters, controls } = createMockAdapters();
 *   controls.signInAs("coordinator");
 *   const result = await adapters.registry.listCustomers({ q: "cedar" });
 *   if (!result.ok) showError(result.error);
 *
 * Every instance holds its own fresh copy of the synthetic fixtures; nothing is saved anywhere.
 * Must not be used in production after the S2 release signoff (PC-S3-09).
 */
import type { Adapters, Role, Session } from "../../../types";
import { createEmptyFixtureData, createFixtureData } from "../../fixtures/data";
import { createMockAuthAdapter, sessionFor } from "../auth/mock";
import { createMockDashboardAdapter } from "../dashboard/mock";
import { createMockDispatchAdapter } from "../dispatch/mock";
import { createMockInspectionsAdapter } from "../inspections/mock";
import { createMockMaintenanceAdapter } from "../maintenance/mock";
import { createMockRegistryAdapter } from "../registry/mock";
import { DEFAULT_MOCK_DELAY_MS, type MockContext, type MockOptions, type MockScenario } from "./runtime";

export { MOCK_SCENARIOS, DEFAULT_MOCK_DELAY_MS, SLOW_MOCK_DELAY_MS } from "./runtime";
export type { MockOptions, MockScenario } from "./runtime";

export interface MockControls {
  getScenario(): MockScenario;
  /** Switching into or out of "empty" reseeds the data (earlier mock edits are discarded). */
  setScenario(scenario: MockScenario): void;
  /** Sign in as the first active demo user with this role, or as a specific profile id. */
  signInAs(roleOrProfileId: Role | string): Session;
  signOut(): void;
  /** Discard all mock edits and reload the fixtures for the current scenario. */
  reset(): void;
}

export function createMockAdapters(options: MockOptions = {}): { adapters: Adapters; controls: MockControls } {
  const scenario = options.scenario ?? "ok";
  const seed = () => (ctx.scenario === "empty" ? createEmptyFixtureData() : createFixtureData());
  const ctx: MockContext = {
    store: scenario === "empty" ? createEmptyFixtureData() : createFixtureData(),
    session: options.session ?? null,
    scenario,
    delayMs: options.delayMs ?? DEFAULT_MOCK_DELAY_MS,
    now: options.now ?? (() => new Date()),
    newId: options.newId ?? (() => crypto.randomUUID()),
  };

  const adapters: Adapters = {
    auth: createMockAuthAdapter(ctx),
    registry: createMockRegistryAdapter(ctx),
    maintenance: createMockMaintenanceAdapter(ctx),
    dispatch: createMockDispatchAdapter(ctx),
    inspections: createMockInspectionsAdapter(ctx),
    dashboard: createMockDashboardAdapter(ctx),
  };

  const controls: MockControls = {
    getScenario: () => ctx.scenario,
    setScenario: (next) => {
      const reseed = (ctx.scenario === "empty") !== (next === "empty");
      ctx.scenario = next;
      if (reseed) ctx.store = seed();
    },
    signInAs: (roleOrProfileId) => {
      const profile = ctx.store.profiles.find((candidate) => candidate.active && (candidate.id === roleOrProfileId || candidate.role === roleOrProfileId));
      if (!profile) throw new Error(`No active demo profile for ${roleOrProfileId}`);
      ctx.session = sessionFor(profile, ctx.now());
      return structuredClone(ctx.session);
    },
    signOut: () => {
      ctx.session = null;
    },
    reset: () => {
      ctx.store = seed();
    },
  };

  return { adapters, controls };
}
