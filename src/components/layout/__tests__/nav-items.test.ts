import { describe, expect, it } from "vitest";
import { COORDINATOR_NAV, isActivePath, navFor, roleHome } from "../nav-items";

describe("isActivePath", () => {
  it("matches the route and its child routes", () => {
    expect(isActivePath("/customers", "/customers")).toBe(true);
    expect(isActivePath("/customers/123/sites", "/customers")).toBe(true);
    expect(isActivePath("/dashboard/", "/dashboard")).toBe(true);
  });

  it("does not match prefixes of other words or unrelated routes", () => {
    expect(isActivePath("/customers-archive", "/customers")).toBe(false);
    expect(isActivePath("/dashboard", "/jobs")).toBe(false);
    expect(isActivePath(null, "/dashboard")).toBe(false);
  });

  it("activates exactly one coordinator item for a nested route", () => {
    expect(COORDINATOR_NAV.filter((item) => isActivePath("/systems/abc", item.href)).map((item) => item.label)).toEqual(["Systems"]);
  });
});

describe("role navigation", () => {
  it("sends each role to its own home and shows only its own routes", () => {
    expect(roleHome("coordinator")).toBe("/dashboard");
    expect(roleHome("technician")).toBe("/technician");
    expect(navFor("technician").map((item) => item.href)).toEqual(["/technician"]);
    expect(navFor("coordinator").some((item) => item.href === "/technician")).toBe(false);
  });
});
