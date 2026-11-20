import { describe, expect, it } from "vitest";
import { appName } from "../site";

describe("scaffold", () => {
  it("exposes the app name", () => {
    expect(appName).toBe("PanelCare");
  });
});
