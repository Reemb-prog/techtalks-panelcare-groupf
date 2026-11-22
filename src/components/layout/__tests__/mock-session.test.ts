import { describe, expect, it } from "vitest";
import { createMockAdapters } from "../../../lib/adapters";
import {
  MOCK_ROLE_KEY,
  MOCK_SCENARIO_KEY,
  readMockRole,
  readMockScenario,
  restoreMockSession,
  writeMockRole,
  writeMockScenario,
  type StorageLike,
} from "../mock-session";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("mock session storage", () => {
  it("round-trips the demo role and scenario", () => {
    const storage = memoryStorage();
    writeMockRole(storage, "coordinator");
    writeMockScenario(storage, "empty");
    expect(readMockRole(storage)).toBe("coordinator");
    expect(readMockScenario(storage)).toBe("empty");
    writeMockRole(storage, null);
    writeMockScenario(storage, "ok");
    expect(storage.data.size).toBe(0);
  });

  it("rejects and clears tampered values", () => {
    const storage = memoryStorage({ [MOCK_ROLE_KEY]: "admin", [MOCK_SCENARIO_KEY]: "hacked" });
    expect(readMockRole(storage)).toBeNull();
    expect(readMockScenario(storage)).toBe("ok");
    expect(storage.data.size).toBe(0);
  });

  it("treats missing or blocked storage as signed out with normal data", () => {
    expect(readMockRole(null)).toBeNull();
    expect(readMockRole(throwingStorage)).toBeNull();
    expect(readMockScenario(throwingStorage)).toBe("ok");
    expect(() => writeMockRole(throwingStorage, "technician")).not.toThrow();
  });
});

describe("restoreMockSession with the mock adapters", () => {
  it("restores a stored coordinator so dashboard calls succeed", async () => {
    const { adapters, controls } = createMockAdapters({ delayMs: 0 });
    const session = restoreMockSession(memoryStorage({ [MOCK_ROLE_KEY]: "coordinator" }), controls);
    expect(session?.role).toBe("coordinator");
    const stats = await adapters.dashboard.getStats();
    expect(stats.ok).toBe(true);
  });

  it("a stored technician gets FORBIDDEN from coordinator data", async () => {
    const { adapters, controls } = createMockAdapters({ delayMs: 0 });
    restoreMockSession(memoryStorage({ [MOCK_ROLE_KEY]: "technician" }), controls);
    const stats = await adapters.dashboard.getStats();
    expect(stats.ok ? null : stats.error.code).toBe("FORBIDDEN");
  });

  it("stays signed out without a stored role and applies the stored scenario", async () => {
    const { adapters, controls } = createMockAdapters({ delayMs: 0 });
    expect(restoreMockSession(memoryStorage({ [MOCK_SCENARIO_KEY]: "error" }), controls)).toBeNull();
    expect(controls.getScenario()).toBe("error");
    const stats = await adapters.dashboard.getStats();
    expect(stats.ok ? null : stats.error.code).toBe("INTERNAL");
  });
});
