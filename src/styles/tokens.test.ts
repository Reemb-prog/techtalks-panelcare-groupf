import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const declarations = [...stylesheet.matchAll(/^\s*(--pc-[a-z0-9-]+): ([^;]+);$/gm)];
const tokens = new Map(declarations.map(([, name, value]) => [name, value]));

function luminance(hex: string) {
  if (!/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(hex)) {
    throw new Error(`Expected a hex color, received ${hex}`);
  }
  const digits = hex.slice(1);
  const expanded = digits.length === 3
    ? [...digits].map((digit) => digit.repeat(2)).join("")
    : digits;
  const channels = [0, 2, 4].map((index) => {
    const srgb = Number.parseInt(expanded.slice(index, index + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  const [red, green, blue] = channels;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const first = luminance(tokens.get(`--pc-${foreground}`) ?? "");
  const second = luminance(tokens.get(`--pc-${background}`) ?? "");
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("PanelCare design tokens", () => {
  it("exposes unique foundation variables for the coordinator shell", () => {
    expect(stylesheet).toMatch(/^:root\s*\{/);
    expect(tokens.size).toBe(declarations.length);
    for (const name of ["color-primary", "font-sans", "type-body", "line-body",
      "space-4", "radius-control", "control-min-height", "color-focus"]) {
      expect(tokens.has(`--pc-${name}`), name).toBe(true);
    }
  });

  it.each(["neutral", "info", "warning", "success", "danger"])(
    "keeps %s status labels readable",
    (status) => {
      expect(contrast(`status-${status}-text`, `status-${status}-bg`)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(["primary", "primary-hover"])("keeps text readable on %s", (action) => {
    expect(contrast("color-on-primary", `color-${action}`)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["canvas", "surface"])("keeps control boundaries and focus visible on %s", (surface) => {
    expect(contrast("color-control-border", `color-${surface}`)).toBeGreaterThanOrEqual(3);
    expect(contrast("color-focus", `color-${surface}`)).toBeGreaterThanOrEqual(3);
    expect(contrast("color-text-muted", `color-${surface}`)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the sign-in panel's supporting copy readable", () => {
    expect(contrast("color-accent", "color-text")).toBeGreaterThanOrEqual(4.5);
  });
});
