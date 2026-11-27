import { expect, test, type Page } from "@playwright/test";

/** PC-S1-07: dispatch board on mock data. Runs on the desktop and mobile projects. */

const JOB_3 = "00000007-0000-4000-8000-000000000003"; // fixture: scheduled, unassigned, 31 Dec 2026, plan 1

async function openBoard(page: Page, query = "") {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as demo coordinator" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.goto("/jobs" + query);
  await expect(page.getByRole("heading", { level: 1, name: "Dispatch board" })).toBeVisible({ timeout: 20_000 });
}

test("filter to unassigned visits and assign a technician", async ({ page }) => {
  await openBoard(page);
  await expect(page.getByRole("complementary", { name: "Simulated scheduling" })).toContainText("Scheduling is simulated");

  await page.getByLabel("Technician").selectOption({ label: "Not assigned" });
  await expect(page).toHaveURL(/technician=unassigned/);
  const table = page.getByRole("region", { name: "Visits" });
  await expect(table.getByRole("row").nth(1)).toContainText("Not assigned");

  await table.getByRole("button", { name: /^Manage visit on/ }).first().click();
  const drawer = page.getByRole("dialog", { name: "Visit details" });
  await expect(page).toHaveURL(/job=/);
  await drawer.getByRole("button", { name: "Assign technician" }).click();
  await drawer.getByLabel("Technician").selectOption({ label: "Hadi Nasr" });
  await drawer.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(drawer.getByRole("status")).toContainText("Assigned to Hadi Nasr.");
  await expect(drawer).toContainText("Hadi Nasr");

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page).not.toHaveURL(/job=/);
});

test("a clashing reschedule is refused and nothing changes; cancel then reactivate", async ({ page }) => {
  await openBoard(page, `?status=all&job=${JOB_3}`);
  const drawer = page.getByRole("dialog", { name: "Visit details" });
  await expect(drawer).toContainText("31 Dec 2026");

  // 30 Nov 2026 is already used by the same plan (or, once that date has passed, is in the past): refused either way.
  await drawer.getByRole("button", { name: "Reschedule" }).click();
  await drawer.getByLabel("New date").fill("2026-11-30");
  await drawer.getByLabel("Reason (kept in the visit history)").fill("Customer request");
  await drawer.getByRole("button", { name: "Reschedule" }).last().click();
  await expect(drawer.getByRole("alert")).toContainText("Not saved");
  await expect(drawer).toContainText("31 Dec 2026");

  await drawer.getByRole("button", { name: "Cancel visit" }).first().click();
  await drawer.getByRole("button", { name: "Cancel visit" }).last().click();
  await expect(drawer.getByLabel("Reason (kept in the visit history)")).toBeFocused();
  await drawer.getByLabel("Reason (kept in the visit history)").fill("Site closed for renovation");
  await drawer.getByRole("button", { name: "Cancel visit" }).last().click();
  await expect(drawer.getByRole("status")).toContainText("The visit was cancelled.");
  await expect(drawer).toContainText("Site closed for renovation");
  await expect(drawer.getByRole("button", { name: "Reactivate" })).toBeVisible();
});

test("completed visits are read-only and link to their report", async ({ page }) => {
  await openBoard(page, "?status=completed");
  await page.getByRole("region", { name: "Visits" }).getByRole("button", { name: /^Manage visit on/ }).first().click();
  const drawer = page.getByRole("dialog", { name: "Visit details" });
  await expect(drawer.getByRole("region", { name: "This visit is completed" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Open service report" })).toHaveAttribute("href", /\/reports\//);
  await expect(drawer.getByRole("group", { name: "Actions" })).toHaveCount(0);
});

test("bad filter values in the link are reported, not fatal", async ({ page }) => {
  await openBoard(page, "?status=bogus&from=2026-02-30");
  await expect(page.getByRole("region", { name: "Some filters in the link were ignored" })).toContainText("not recognised");
  await expect(page.getByRole("region", { name: "Visits" })).toBeVisible();
});

test("empty, error and denied mock scenarios", async ({ page }) => {
  await openBoard(page);
  const scenario = page.getByLabel("Mock data");

  await scenario.selectOption({ label: "No records" });
  await expect(page.getByRole("region", { name: "No visits match these filters" })).toBeVisible();

  await scenario.selectOption({ label: "Server error" });
  const alert = page.locator("#main").getByRole("alert");
  await expect(alert).toContainText("The dispatch board could not load");
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(alert).toContainText("(simulated)");

  await scenario.selectOption({ label: "Permission denied" });
  await expect(page.getByRole("region", { name: "You don't have access to this page" })).toBeVisible();
});
