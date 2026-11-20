/**
 * Deterministic, valid v4-format UUIDs for fixtures, readable in test output.
 * fixtureId("customer", 2) === "00000002-0000-4000-8000-000000000002".
 */
const KIND_PREFIX = {
  profile: 1,
  customer: 2,
  site: 3,
  system: 4,
  component: 5,
  plan: 6,
  job: 7,
  inspection: 8,
  report: 9,
  photo: 10,
} as const;

export type FixtureKind = keyof typeof KIND_PREFIX;

export function fixtureId(kind: FixtureKind, n: number): string {
  return `${KIND_PREFIX[kind].toString(16).padStart(8, "0")}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}
