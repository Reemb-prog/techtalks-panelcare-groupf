import { expect, test, type Page } from "@playwright/test";
import { fixtureId } from "../../lib/fixtures/ids";

const assignedJobId = fixtureId("job", 2);
const assignedJobPath = `/technician/jobs/${assignedJobId}`;
const anotherTechnicianJobId = fixtureId("job", 5);

async function signIn(page: Page, role: "technician" | "coordinator" = "technician") {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as demo ${role}` }).click();
  await expect(page).toHaveURL(role === "technician" ? /\/technician$/ : /\/dashboard$/, { timeout: 20_000 });
}

test("lists the technician's jobs and opens the selected job", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "My Jobs" })).toBeVisible();
  const jobs = page.getByRole("list", { name: "Assigned jobs" });
  const assignedJobLink = jobs.getByRole("link", { name: /^View Job/ }).and(page.locator(`[href="${assignedJobPath}"]`));
  await expect(assignedJobLink).toBeVisible();
  await expect(jobs.locator(`[href$="${anotherTechnicianJobId}"]`)).toHaveCount(0);
  const card = jobs.getByRole("listitem").filter({ has: page.locator(`[href="${assignedJobPath}"]`) });
  const site = await card.getByRole("heading").innerText();
  await expect(card.getByText("Assigned", { exact: true })).toBeVisible();
  await assignedJobLink.click();
  await expect(page).toHaveURL(new RegExp(`${assignedJobPath}$`));
  await expect(page.getByRole("heading", { name: "Job Details" })).toBeVisible();
  const detail = page.getByRole("region", { name: site });
  await expect(detail.getByText(assignedJobId)).toBeVisible();
  await expect(detail.getByText("Assigned", { exact: true })).toBeVisible();
  await expect(detail.locator("time")).toHaveAttribute("datetime", "2026-11-30");
  await page.getByRole("link", { name: "Back to My Jobs" }).click();
  await expect(jobs).toBeVisible();
});

test("shows loading, empty, error and denied job-list states", async ({ page }) => {
  await signIn(page);
  const mockData = page.getByLabel("Mock data");
  const main = page.locator("#main");
  const jobs = main.getByRole("list", { name: "Assigned jobs" });
  await expect(jobs).toBeVisible();

  await mockData.selectOption("slow");
  await expect(main.getByRole("status")).toHaveText("Loading your jobs…");
  await expect(jobs).toBeVisible();
  await mockData.selectOption("empty");
  await expect(main.getByRole("status")).toHaveText("You have no assigned jobs right now. New assignments will appear here.");

  await mockData.selectOption("error");
  await expect(main.getByRole("alert")).toHaveText("Unable to load your jobs.");
  await main.getByRole("button", { name: "Retry" }).click();
  await expect(main.getByRole("alert")).toHaveText("Unable to load your jobs.");

  await mockData.selectOption("denied");
  await expect(main.getByRole("heading", { name: "Permission denied" })).toBeVisible();
  await expect(jobs).toHaveCount(0);
  await mockData.selectOption("ok");
  await expect(jobs).toBeVisible();
});

test("handles failed, denied and unavailable job detail requests", async ({ page }) => {
  await signIn(page);
  await page.goto(assignedJobPath);
  const main = page.locator("#main");
  const mockData = page.getByLabel("Mock data");
  const jobId = main.getByText(assignedJobId);
  await expect(jobId).toBeVisible();

  await mockData.selectOption("slow");
  await expect(main.getByRole("status")).toHaveText("Loading job details…");
  await expect(jobId).toBeVisible();
  await mockData.selectOption("error");
  await expect(main.getByRole("alert")).toHaveText("Unable to load job details.");
  await main.getByRole("button", { name: "Retry" }).click();
  await expect(main.getByRole("alert")).toHaveText("Unable to load job details.");
  await mockData.selectOption("denied");
  await expect(main.getByRole("heading", { name: "Permission denied" })).toBeVisible();
  await expect(jobId).toHaveCount(0);
  await mockData.selectOption("ok");
  await expect(jobId).toBeVisible();

  for (const id of [anotherTechnicianJobId, fixtureId("job", 999)]) {
    await page.goto(`/technician/jobs/${id}`);
    const unavailable = main.getByRole("alert");
    await expect(unavailable.getByRole("heading", { name: "Job unavailable" })).toBeVisible();
    await expect(unavailable.getByText("This job could not be found.")).toBeVisible();
    await expect(main.getByText("Job ID")).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Back to My Jobs" })).toBeVisible();
  }
});

test("redirects a signed-out visitor and denies a coordinator in the technician area", async ({ page }) => {
  await page.goto(assignedJobPath);
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await signIn(page, "coordinator");
  for (const path of ["/technician", assignedJobPath]) {
    await page.goto(path);
    const main = page.locator("#main");
    await expect(main.getByRole("heading", { name: "Permission denied" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard");
    await expect(main.getByRole("list", { name: "Assigned jobs" })).toHaveCount(0);
    await expect(main.getByText(assignedJobId)).toHaveCount(0);
  }
});

test("job list and details fit the three review widths", async ({ page, isMobile }, info) => {
  test.skip(isMobile, "The desktop project explicitly sets all three CSS viewports.");
  await signIn(page);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const jobLink = page.getByRole("list", { name: "Assigned jobs" }).getByRole("link", { name: /^View Job/ }).and(page.locator(`[href="${assignedJobPath}"]`));
    await expect(jobLink).toBeVisible();
    await jobLink.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(jobLink).toBeFocused();
    expect(await jobLink.evaluate((link) => getComputedStyle(link).outlineStyle)).toBe("solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: info.outputPath(`my-jobs-${width}.png`), fullPage: true, animations: "disabled" });
    await page.keyboard.press("Enter");
    await expect(page.getByText(assignedJobId)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: info.outputPath(`job-details-${width}.png`), fullPage: true, animations: "disabled" });
    await page.getByRole("link", { name: "Back to My Jobs" }).click();
  }
});
