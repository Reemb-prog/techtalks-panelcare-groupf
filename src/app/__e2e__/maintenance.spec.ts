import { expect, test, type Page } from "@playwright/test";

/** PC-S1-07: maintenance planner on mock data. Runs on the desktop and mobile projects. */

const PLAN_1 = "00000006-0000-4000-8000-000000000001"; // fixture: monthly from 31 Jan 2026, Cedar Ridge

async function signInAs(page: Page, role: "coordinator" | "technician") {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as demo ${role}` }).click();
  // Generous timeout: a cold `next dev` server compiles the landing route on first visit.
  await expect(page).toHaveURL(role === "coordinator" ? /\/dashboard$/ : /\/technician$/, { timeout: 20_000 });
}

test("create a plan with a live preview, then pause, resume and generate", async ({ page }) => {
  await signInAs(page, "coordinator");
  await page.goto("/maintenance");
  await expect(page.getByRole("heading", { level: 1, name: "Maintenance plans" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("complementary", { name: "Simulated scheduling" })).toContainText("Scheduling is simulated");

  await page.getByRole("link", { name: "New plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "New maintenance plan" })).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Solar system").selectOption({ label: "Olive Grove School · Classroom block · Classroom array" });
  await page.getByLabel("How often").selectOption({ label: "Every month" });
  await page.getByLabel("First visit date").fill("2026-01-31");

  const preview = page.getByRole("region", { name: "Upcoming visit dates" });
  await expect(preview).toContainText("Every month from 31 Jan 2026 (shorter months use their last day)");
  await expect(preview.getByRole("listitem")).toHaveCount(6);

  await page.getByRole("button", { name: "Create plan" }).click();
  await expect(page).toHaveURL(/\/maintenance\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Classroom array" })).toBeVisible();
  const schedule = page.getByRole("region", { name: "Schedule" });
  await expect(schedule).toContainText("Active");

  await page.getByRole("button", { name: "Pause plan" }).click();
  const pause = page.getByRole("dialog", { name: "Pause this plan?" });
  await expect(pause).toContainText("No new visits will be generated");
  await pause.getByRole("button", { name: "Pause plan" }).click();
  await expect(pause).toBeHidden();
  await expect(schedule).toContainText("Paused");
  await expect(page.getByText("Resume the plan to generate visits.")).toBeVisible();

  await page.getByRole("button", { name: "Resume plan" }).click();
  await page.getByRole("dialog", { name: "Resume this plan?" }).getByRole("button", { name: "Resume plan" }).click();
  await expect(schedule).toContainText("Active");

  await page.getByRole("button", { name: "Generate visits for this plan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Simulated generation finished" })).toContainText(/added/);
});

test("invalid input is explained, focused and not saved", async ({ page }) => {
  await signInAs(page, "coordinator");
  await page.goto("/maintenance/new");
  await expect(page.getByRole("heading", { level: 1, name: "New maintenance plan" })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Create plan" }).click();
  await expect(page.locator("#main").getByRole("alert")).toContainText("The plan was not saved");
  await expect(page.getByLabel("Solar system")).toBeFocused();

  await page.getByLabel("Solar system").selectOption({ index: 1 });
  await page.getByLabel("How often").selectOption({ label: "Another number of months…" });
  await page.getByLabel("Months between visits (1 to 60)").fill("0");
  await expect(page.getByRole("region", { name: "Upcoming visit dates" })).toContainText("Choose how often and a first visit date");
  await page.getByRole("button", { name: "Create plan" }).click();
  await expect(page.getByLabel("Months between visits (1 to 60)")).toBeFocused();
  await expect(page).toHaveURL(/\/maintenance\/new$/);
});

test("editing a schedule shows its impact before saving", async ({ page }) => {
  await signInAs(page, "coordinator");
  await page.goto(`/maintenance/${PLAN_1}/edit`);
  await expect(page.getByRole("heading", { level: 1, name: "Edit schedule" })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Save schedule" }).click();
  await expect(page.locator("#main").getByRole("alert")).toContainText("Nothing changed");

  await page.getByLabel("First visit date").fill("2026-01-15");
  await expect(page.getByRole("region", { name: "What this change does" })).toContainText("visit");
  await page.getByRole("button", { name: "Save schedule" }).click();
  await expect(page).toHaveURL(new RegExp(`/maintenance/${PLAN_1}$`));
  await expect(page.getByRole("region", { name: "Schedule" })).toContainText("Every month from 15 Jan 2026");
});

test("empty, error and denied mock scenarios", async ({ page }) => {
  await signInAs(page, "coordinator");
  await page.goto("/maintenance");
  await expect(page.getByRole("heading", { level: 1, name: "Maintenance plans" })).toBeVisible({ timeout: 20_000 });
  const scenario = page.getByLabel("Mock data");

  await scenario.selectOption("slow");
  await expect(page.getByTestId("loading-skeleton")).toBeVisible();
  await expect(page.getByTestId("loading-skeleton")).toHaveCount(0);
  await scenario.selectOption({ label: "No records" });
  await expect(page.getByRole("region", { name: "No maintenance plans yet" })).toBeVisible();

  await scenario.selectOption({ label: "Server error" });
  const alert = page.locator("#main").getByRole("alert");
  await expect(alert).toContainText("The plans could not load");
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(alert).toContainText("(simulated)");

  await scenario.selectOption({ label: "Permission denied" });
  await expect(page.getByRole("region", { name: "You don't have access to this page" })).toBeVisible();

  await scenario.selectOption({ label: "Normal data" });
  await expect(page.getByRole("link", { name: "Cedar Ridge Apartments" }).first()).toBeVisible();
});

test("technicians see a way back to their own jobs", async ({ page }) => {
  await signInAs(page, "technician");
  for (const path of ["/maintenance", "/jobs"]) {
    await page.goto(path);
    const denied = page.getByRole("region", { name: "You don't have access to this page" });
    await expect(denied).toContainText("for coordinators", { timeout: 20_000 });
    await expect(denied.getByRole("link", { name: "Go to My jobs" })).toHaveAttribute("href", "/technician");
  }
});
