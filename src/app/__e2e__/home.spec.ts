import { expect, test } from "@playwright/test";

test("the root URL opens the mock sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to PanelCare");
});
