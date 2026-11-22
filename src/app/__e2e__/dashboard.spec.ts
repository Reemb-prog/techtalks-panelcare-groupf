import { expect, test, type Page } from "@playwright/test";

/** PC-S1-05: mock sign-in, coordinator shell and dashboard states. Runs on the desktop and mobile projects. */

async function signInAs(page: Page, role: "coordinator" | "technician") {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as demo ${role}` }).click();
}

async function openMenuIfMobile(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
}

test("mock sign-in is labeled and opens the coordinator dashboard", async ({ page, isMobile }) => {
  await page.goto("/login");
  await expect(page.getByRole("note", { name: "Mock sign-in" })).toContainText("not a real login");
  await expect(page.getByLabel(/password/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Continue as demo coordinator" }).click();
  // Generous timeout: on a cold `next dev` server the first visit compiles the dashboard route.
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Mock mode" })).toContainText("not a real sign-in");

  const cards = page.getByRole("region", { name: "Visit summary" }).getByRole("listitem");
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText(/Upcoming visits\s*\d+/);
  await expect(page.getByRole("heading", { name: "Upcoming and overdue visits" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Expiring warranties" })).toBeVisible();
  await expect(page.getByRole("search")).toBeVisible();

  // Reload keeps the demo session for this tab.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();

  await openMenuIfMobile(page, isMobile);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("keyboard: skip link and current page in the navigation", async ({ page, isMobile }) => {
  await signInAs(page, "coordinator");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();

  // The skip link is the first stop in the page; in `next dev` the Next.js Dev Tools button may come before it.
  const skip = page.getByRole("link", { name: "Skip to main content" });
  for (let press = 0; press < 3 && !(await skip.evaluate((element) => element === document.activeElement)); press++) {
    await page.keyboard.press("Tab");
  }
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();

  await openMenuIfMobile(page, isMobile);
  const current = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dispatch" })).not.toHaveAttribute("aria-current", "page");
});

test("mobile menu opens as a dialog, closes on Escape and returns focus", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The drawer only exists below the desktop breakpoint.");
  await signInAs(page, "coordinator");
  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Customers" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("empty, error and denied mock scenarios", async ({ page }) => {
  await signInAs(page, "coordinator");
  const scenario = page.getByLabel("Mock data");

  await scenario.selectOption({ label: "No records" });
  await expect(page.getByRole("region", { name: "No maintenance activity yet" })).toBeVisible();
  await expect(page.getByText("No warranties expire in the next 90 days.")).toBeVisible();

  await scenario.selectOption({ label: "Server error" });
  // Scoped to main: Next.js keeps its own route-announcer alert in the page.
  const alert = page.locator("#main").getByRole("alert");
  await expect(alert).toContainText("The dashboard could not load");
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(alert).toContainText("(simulated)");

  await scenario.selectOption({ label: "Permission denied" });
  await expect(page.getByRole("region", { name: "You don't have access to this page" })).toBeVisible();

  await scenario.selectOption({ label: "Normal data" });
  await expect(page.getByRole("region", { name: "Visit summary" })).toBeVisible();
});

test("a technician sees the denied state on the dashboard", async ({ page }) => {
  await signInAs(page, "technician");
  await expect(page).toHaveURL(/\/technician$/);
  await page.goto("/dashboard");
  const denied = page.getByRole("region", { name: "You don't have access to this page" });
  await expect(denied).toContainText("for coordinators");
  await expect(denied.getByRole("link", { name: "Go to My jobs" })).toHaveAttribute("href", "/technician");
  await expect(page.getByRole("region", { name: "Visit summary" })).toHaveCount(0);
});
