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
  await expect(page).toHaveURL(new RegExp(`${assignedJobPath}$`), { timeout: 20_000 });
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

test("starts a job and validates readings before opening photos and notes", async ({ page }) => {
  await signIn(page);
  await page.goto(assignedJobPath);
  await expect(page.getByRole("heading", { name: "Inspection Checklist" })).toHaveCount(0);
  await page.getByRole("button", { name: "Start Job", exact: true }).click();
  await expect(page.getByText("In progress", { exact: true })).toBeVisible();

  const safety = page.getByLabel(/AC and DC isolators/);
  const output = page.getByLabel(/AC output at time of visit \(kW\)/);
  const next = page.getByRole("button", { name: "Continue to Photo Evidence" });
  await next.click();
  await expect(safety).toBeFocused();
  await expect(safety).toHaveAttribute("aria-invalid", "true");
  await safety.selectOption("false");
  await page.getByLabel(/Panel surface condition/).selectOption("good");
  await page.getByLabel(/Mounting and fixings secure/).selectOption("true");
  await page.getByLabel(/Inverter shows no active faults/).selectOption("true");
  await page.getByLabel(/String DC voltage \(V\)/).fill("0");
  await output.fill("1001");
  await page.getByLabel(/Panel cleaning performed/).selectOption("none");
  await next.click();
  await expect(output).toBeFocused();
  await expect(page.getByText("Must be at most 1000 kW.")).toBeVisible();
  await expect(safety).toHaveValue("false");
  await output.fill("0");
  await next.click();
  await expect(page.getByRole("heading", { name: "Photo Evidence and Notes" })).toBeFocused();

  const notes = page.getByLabel("Inspection notes (optional)");
  const picker = page.getByLabel("Add photos");
  await notes.fill("Demo visit note");
  await picker.setInputFiles([
    { name: "visit.txt", mimeType: "text/plain", buffer: Buffer.from("demo") },
    {
      name: "panel.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    },
  ]);
  await expect(page.getByText("visit.txt: Use a JPEG, PNG or WebP image.")).toBeVisible();
  const preview = page.getByRole("img", { name: "Selected photo: panel.png" });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByLabel("Caption for photo 1 (optional)").fill("Demo panel");
  await page.getByRole("button", { name: "Back to Checklist" }).click();
  await expect(page.getByRole("heading", { name: "Inspection Checklist" })).toBeFocused();
  await expect(output).toHaveValue("0");
  await next.click();
  await expect(notes).toHaveValue("Demo visit note");
  await expect(page.getByLabel("Caption for photo 1 (optional)")).toHaveValue("Demo panel");
  await expect(preview).toBeVisible();
  await page.getByRole("button", { name: /Remove Photo 1: panel.png/ }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByText("0 of 10 selected.", { exact: false })).toBeVisible();
});

test("offers a retry when the mock Start Job action fails", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-26T12:00:00Z") });
  await signIn(page);
  await page.goto(assignedJobPath);
  const mockData = page.getByLabel("Mock data");
  const start = page.getByRole("button", { name: "Start Job", exact: true });
  await mockData.selectOption("slow");
  await start.click();
  await expect(page.getByRole("button", { name: "Starting job…" })).toBeDisabled();
  await mockData.selectOption("error");
  await expect(page.getByText("Unable to load job details.")).toBeVisible();
  await page.clock.runFor(2500);
  await mockData.selectOption("ok");
  await expect(page.getByText("Unable to start the job. Try again.")).toBeVisible();
  await expect(page.getByText("Assigned", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry Start Job" }).click();
  await expect(page.getByRole("heading", { name: "Inspection Checklist" })).toBeVisible();
});

async function openConfirmation(page: Page, withPhoto = false) {
  await signIn(page);
  await page.goto(`/technician/jobs/${fixtureId("job", 7)}`);
  await page.getByLabel(/AC and DC isolators/).selectOption("true");
  await page.getByLabel(/Panel surface condition/).selectOption("good");
  await page.getByLabel(/Mounting and fixings secure/).selectOption("true");
  await page.getByLabel(/Inverter shows no active faults/).selectOption("false");
  await page.getByLabel(/String DC voltage \(V\)/).fill("0");
  await page.getByLabel(/AC output at time of visit \(kW\)/).fill("2.5");
  await page.getByLabel(/Panel cleaning performed/).selectOption("none");
  await page.getByRole("button", { name: "Continue to Photo Evidence" }).click();
  if (withPhoto) {
    await page.getByLabel("Inspection notes (optional)").fill("Checked the demo array.");
    await page.getByLabel("Add photos").setInputFiles({
      name: "panel.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    });
    await page.getByLabel("Caption for photo 1 (optional)").fill("Panel after review");
  }
  await page.getByRole("button", { name: "Continue to Confirmation" }).click();
  await expect(page.getByRole("heading", { name: "Review & Confirm" })).toBeFocused();
}

test("validates confirmation and opens the report after mock completion", async ({ page }) => {
  await openConfirmation(page, true);
  const submit = page.getByRole("button", { name: "Submit Inspection", exact: true });
  const name = page.getByLabel("Customer name", { exact: true });
  const acknowledges = page.getByRole("checkbox", { name: /acknowledges/ });
  await submit.click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await name.fill("Demo Customer");
  await submit.click();
  await expect(acknowledges).toBeFocused();
  await expect(acknowledges).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Inspection completed (demo).")).toHaveCount(0);
  await acknowledges.check();
  await submit.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.getByText("Inspection completed (demo).")).toBeVisible();
  await page.getByRole("link", { name: "View Service Report" }).click();
  await expect(page.getByRole("heading", { name: "Service Report", exact: true })).toBeVisible();
  const report = page.getByRole("main");
  await expect(report.getByText("0 V", { exact: true })).toBeVisible();
  await expect(report.getByText("No", { exact: true })).toBeVisible();
  await expect(report.getByText("2.5 kW", { exact: true })).toBeVisible();
  await expect(report.getByText("Checked the demo array.")).toBeVisible();
  const photos = report.getByRole("region", { name: "Photo evidence" });
  await expect(photos.getByRole("listitem")).toHaveCount(1);
  await expect(photos.getByText("Panel after review")).toBeVisible();
  await expect(photos.getByText("Image preview unavailable in this demo.")).toBeVisible();
  await expect(report.getByText("Demo Customer", { exact: true })).toBeVisible();
  const reportPath = new URL(page.url()).pathname;
  await report.getByRole("link", { name: "Back to My Jobs" }).click();
  await page.getByRole("link", { name: /^View Job/ }).and(page.locator(`[href="/technician/jobs/${fixtureId("job", 7)}"]`)).click();
  await expect(page.getByRole("link", { name: "View Service Report" })).toHaveAttribute("href", reportPath);
  await expect(page.getByRole("button", { name: "Submit Inspection" })).toHaveCount(0);
});

test("checks job status before retrying an unconfirmed submission", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-26T12:00:00Z") });
  await openConfirmation(page);
  const mockData = page.getByLabel("Mock data");
  await page.getByLabel("Customer name", { exact: true }).fill("Demo Customer");
  await page.getByRole("checkbox", { name: /acknowledges/ }).check();
  await mockData.selectOption("slow");
  await page.getByRole("button", { name: "Submit Inspection", exact: true }).click();
  await expect(page.getByRole("button", { name: "Submitting inspection…" })).toBeDisabled();
  await mockData.selectOption("error");
  await expect(page.getByText("Unable to load job details.")).toBeVisible();
  await page.clock.runFor(2500);
  await mockData.selectOption("ok");
  await expect(page.getByText(/Submission status unknown/)).toBeVisible();
  await expect(page.getByRole("link", { name: "View Service Report" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry submission" })).toHaveCount(0);
  await page.getByRole("button", { name: "Check job status" }).click();
  await expect(page.getByText(/Job status checked/)).toBeVisible();
  await page.getByRole("button", { name: "Retry submission" }).click();
  await expect(page.getByText("Inspection completed (demo).")).toBeVisible();
});

test("shows seeded report data to a demo coordinator and hides missing reports", async ({ page }) => {
  await signIn(page, "coordinator");
  await page.goto(`/reports/${fixtureId("report", 1)}`);
  const results = page.getByRole("region", { name: "Inspection results" });
  await expect(results).toBeVisible();
  const mockData = page.getByLabel("Mock data");
  await mockData.selectOption("denied");
  await expect(page.getByText("You don't have permission to view this report.")).toBeVisible();
  await expect(results).toHaveCount(0);
  await mockData.selectOption("ok");
  await expect(results).toBeVisible();
  await page.goto(`/reports/${fixtureId("report", 999)}`);
  const unavailable = page.locator("#main").getByRole("alert");
  await expect(unavailable.getByRole("heading", { name: "Report unavailable" })).toBeVisible();
  await expect(results).toHaveCount(0);
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
