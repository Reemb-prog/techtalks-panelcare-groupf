import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, role = "coordinator") {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as demo " + role }).click();
  await expect(page).toHaveURL(role === "coordinator" ? /\/dashboard$/ : /\/technician$/);
}

async function addComponent(page: Page, serial: string, model: string) {
  await page.getByLabel("Component type").selectOption("panel");
  await page.getByLabel("Manufacturer").fill("Panel Works");
  await page.getByLabel("Model", { exact: true }).fill(model);
  await page.getByLabel("Serial number").fill(serial);
  await page.getByLabel("Install date").fill("2026-11-24");
  await page.getByLabel("Warranty expiry").fill("2028-11-24");
}

test("creates linked registry records and retains the replacement history", async ({ page, isMobile }) => {
  await signIn(page);
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Customers" }).click();
  await page.getByRole("link", { name: "New customer" }).click();
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page.getByLabel("Customer name")).toBeFocused();
  await page.getByLabel("Customer name").fill("Test Solar Customer");
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page.getByRole("heading", { name: "Test Solar Customer", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Add site" }).click();
  await page.getByLabel("Site name").fill("Test Rooftop");
  await page.getByLabel("Street address").fill("1 Demo Street");
  await page.getByLabel("City").fill("Beirut");
  await page.getByLabel("Two-letter country code").fill("lb");
  await page.getByRole("button", { name: "Create site" }).click();
  await page.getByRole("link", { name: "Register system" }).click();
  await page.getByLabel("System name").fill("Demo Roof Array");
  await page.getByLabel("Capacity (kWp)").fill("6.25");
  await page.getByLabel("Install date").fill("2026-11-24");
  await page.getByRole("button", { name: "Add component fields" }).click();
  await page.getByLabel("Component 1 · Component type").selectOption("inverter");
  await page.getByLabel("Component 1 · Manufacturer").fill("Panel Works");
  await page.getByLabel("Component 1 · Model", { exact: true }).fill("Demo inverter");
  await page.getByLabel("Component 1 · Serial number").fill("REG-099");
  await page.getByLabel("Component 1 · Install date").fill("2026-11-24");
  await page.getByRole("button", { name: "Register system" }).click();
  await expect(page.getByRole("heading", { name: "Demo inverter" })).toBeVisible();
  await page.getByRole("link", { name: "Add component" }).click();
  await addComponent(page, "VC10-0001", "First panel");
  await page.getByRole("button", { name: "Create component" }).click();
  await expect(page.locator("#main").getByRole("alert")).toContainText(/already registered/i);
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue("First panel");
  await page.getByLabel("Serial number").fill("REG-100");
  await page.getByRole("button", { name: "Create component" }).click();
  await expect(page.getByRole("heading", { name: "First panel" })).toBeVisible();
  await expect(page.getByText("Warranty expiry: 2028-11-24")).toBeVisible();
  await page.getByRole("link", { name: "Replace component" }).click();
  await addComponent(page, "REG-101", "Second panel");
  await page.getByRole("button", { name: "Save replacement" }).click();
  await expect(page.getByRole("heading", { name: "Second panel" })).toBeVisible();
  await page.getByRole("link", { name: "System details" }).click();
  await expect(page.getByText(/REG-100 → REG-101/)).toBeVisible();
  await page.getByRole("link", { name: "All systems" }).click();
  await page.getByLabel("Search systems").fill("REG-101");
  await page.locator("#main").getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("heading", { name: "Demo Roof Array" })).toBeVisible();
});

test("shows slow, empty, error and denied mock results and recovers", async ({ page }) => {
  await signIn(page);
  await page.goto("/customers");
  const scenario = page.getByLabel("Mock data");
  await scenario.selectOption("slow");
  await expect(page.getByText("Loading registry records…")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Result pages" })).toBeVisible();
  await scenario.selectOption("empty");
  await expect(page.getByRole("heading", { name: "No records yet" })).toBeVisible();
  await scenario.selectOption("error");
  await expect(page.getByRole("heading", { name: "Could not load registry" })).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "Could not load registry" })).toBeVisible();
  await scenario.selectOption("denied");
  await expect(page.getByRole("heading", { name: "Permission denied" })).toBeVisible();
  await scenario.selectOption("ok");
  await expect(page.getByRole("navigation", { name: "Result pages" })).toBeVisible();
});

test("denies a technician opening the registry directly", async ({ page }) => {
  await signIn(page, "technician");
  await page.goto("/systems");
  await expect(page.getByRole("heading", { name: "Permission denied" })).toBeVisible();
  await expect(page.getByLabel("Search systems")).toHaveCount(0);
});

test("a failed mock create keeps entered fields and shows no success", async ({ page }) => {
  await signIn(page);
  await page.goto("/customers/new");
  await page.getByLabel("Mock data").selectOption("error");
  const name = page.getByLabel("Customer name");
  await name.fill("Unsaved mock customer");
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page.locator("#main").getByRole("alert")).toContainText("Please try again");
  await expect(name).toHaveValue("Unsaved mock customer");
  await expect(page).toHaveURL(/\/customers\/new$/);
});

test("registry fits the three review widths with visible keyboard focus", async ({ page, isMobile }, info) => {
  test.skip(isMobile, "The desktop browser explicitly checks all three CSS viewports.");
  await signIn(page);
  await page.goto("/customers");
  await expect(page.getByRole("navigation", { name: "Result pages" })).toBeVisible();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const search = page.getByLabel("Search customers", { exact: true });
    await search.focus();
    await page.keyboard.press("Tab");
    const button = page.locator("#main").getByRole("button", { name: "Search" });
    await expect(button).toBeFocused();
    expect(await button.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: info.outputPath(`registry-${width}.png`), fullPage: true, animations: "disabled" });
  }
});
