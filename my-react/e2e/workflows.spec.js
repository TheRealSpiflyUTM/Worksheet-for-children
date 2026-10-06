import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("worksheet-language"))
      localStorage.setItem("worksheet-language", "en");
  });
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Please log in." } }),
  );
});

test("public entry, login and signup routes render without horizontal overflow", async ({
  page,
}) => {
  for (const path of ["/", "/login", "/signup"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  }
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Account for teachers" }),
  ).toBeVisible();
  await expect(page.getByText("Student", { exact: true })).toHaveCount(0);
});

test("protected workflow routes redirect an anonymous visitor to login", async ({
  page,
}) => {
  for (const path of [
    "/sheets",
    "/teacher/1",
    "/classes",
    "/assignments",
    "/classes/1/children/2",
    "/classes/1/children/2/tests/3",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
  await page.goto("/attempts/1");
  await expect(page).toHaveURL(/\/$/);
});

test("language preference persists locally", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Language").click();
  await page.getByText("Română", { exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Limbă")).toBeVisible();
});
