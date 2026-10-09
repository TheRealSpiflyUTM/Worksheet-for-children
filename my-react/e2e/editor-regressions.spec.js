import { test, expect } from "@playwright/test";

async function mockPlatform(
  page,
  { empty = false, failSecondCreate = false, many = false } = {},
) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("worksheet-language"))
      localStorage.setItem("worksheet-language", "en");
  });
  const definitions = [1, 2].map((id) => ({
    id,
    type: "math-game",
    name: "Easy Math",
    version: id,
    active: true,
    defaultConfiguration: {
      maxNumber: 10,
      exerciseCount: 1,
      operations: ["+"],
    },
  }));
  const worksheet = {
    id: 20,
    name: "Practice",
    items: empty
      ? []
      : [
          {
            id: 30,
            miniGameId: 1,
            orderIndex: 0,
            definition: definitions[0],
            configuration: definitions[0].defaultConfiguration,
          },
        ],
  };
  const changes = [];
  if (many)
    worksheet.items = Array.from({ length: 5 }, (_, index) => ({
      ...worksheet.items[0],
      id: 30 + index,
      orderIndex: index,
    }));
  let nextId = 40;
  let fail = failSecondCreate;
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();
      if (path === "/api/auth/me")
        return route.fulfill({
          json: {
            id: 1,
            role: "TEACHER",
            name: "Teacher",
            email: "teacher@example.com",
          },
        });
      if (path === "/api/auth/csrf")
        return route.fulfill({
          json: { headerName: "X-XSRF-TOKEN", token: "test" },
        });
      if (path === "/api/minigames")
        return route.fulfill({ json: definitions });
      if (path === "/api/worksheets")
        return route.fulfill({ json: [worksheet] });
      if (path === "/api/classes" || path === "/api/assignments")
        return route.fulfill({ json: [] });
      if (path === "/api/worksheets/20" && method === "GET")
        return route.fulfill({ json: worksheet });
      if (path === "/api/worksheets/20" && method === "PUT") {
        worksheet.name = request.postDataJSON().name;
        changes.push({ method, path });
        return route.fulfill({ json: worksheet });
      }
      if (path.startsWith("/api/worksheets/20/items")) {
        if (method === "POST" && nextId === 41 && fail) {
          fail = false;
          return route.fulfill({
            status: 503,
            json: { message: "Connection lost" },
          });
        }
        const id =
          method === "POST" ? nextId++ : Number(path.split("/").at(-1));
        changes.push({
          method,
          path,
          id,
          ...(method === "DELETE" ? {} : { body: request.postDataJSON() }),
        });
        if (method === "DELETE") {
          worksheet.items = worksheet.items.filter((item) => item.id !== id);
          return route.fulfill({ status: 204 });
        }
        const item = { id, ...request.postDataJSON() };
        worksheet.items = [
          ...worksheet.items.filter((entry) => entry.id !== id),
          item,
        ];
        return route.fulfill({ json: item });
      }
      if (path === "/api/worksheets/20/share")
        return route.fulfill({ json: { code: "ORIGINAL" } });
      if (path === "/api/worksheets/20/share/rotate") {
        changes.push({ method, path });
        return route.fulfill({ json: { code: "FRESHCODE" } });
      }
      return route.fulfill({
        status: 404,
        json: { message: `Unexpected request: ${path}` },
      });
    },
  );
  return { worksheet, changes };
}

async function addMath(page) {
  if (await page.locator(".worksheetGameFrame").count())
    await page.locator(".worksheetGameFrame").first().hover();
  await page
    .getByRole("button", { name: "Add activity", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Easy math", exact: true }),
  ).toHaveCount(1);
  await dialog.getByRole("button", { name: "Easy math", exact: true }).click();
}

test("activity controls emerge beside the card without moving it and support keyboard access", async ({
  page,
}, testInfo) => {
  await mockPlatform(page);
  await page.setViewportSize({ width: 2400, height: 1000 });
  await page.goto("/teacher/20");
  const card = page.locator(".worksheetGameContent > *").first();
  const add = page.getByRole("button", { name: "Add activity", exact: true });
  const remove = page.getByRole("button", {
    name: "Remove activity",
    exact: true,
  });
  await expect(add).toHaveCSS("opacity", "0");
  await expect(add).toHaveCSS("transition-duration", "0.3s, 0.3s");
  await expect(add).toHaveCSS(
    "transition-timing-function",
    "ease-in-out, ease-in-out",
  );
  const before = await card.boundingBox();
  await card.hover();
  await expect(add).toHaveCSS("opacity", "1");
  await expect(remove).toHaveCSS("opacity", "1");
  const addBox = await add.boundingBox();
  const removeBox = await remove.boundingBox();
  expect(addBox.x).toBeGreaterThanOrEqual(before.x + before.width);
  expect(removeBox.x).toBeGreaterThanOrEqual(before.x + before.width);
  expect(removeBox.y).toBeGreaterThan(addBox.y + addBox.height);
  expect(addBox.x - (before.x + before.width)).toBeCloseTo(20, 1);
  expect(removeBox.x - (before.x + before.width)).toBeCloseTo(20, 1);
  expect(await card.boundingBox()).toEqual(before);
  await page.screenshot({
    path: testInfo.outputPath("activity-hover.png"),
    animations: "disabled",
  });
  await page.mouse.move(0, 0);
  await expect(add).toHaveCSS("opacity", "0");
  await add.focus();
  await expect(add).toHaveCSS("opacity", "1");
  await add.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(add).toHaveCSS("transition-duration", "0s");
});

test("editor and child preview share styling and responsive card spacing", async ({
  page,
}) => {
  await mockPlatform(page);
  await page.goto("/teacher/20");
  async function switchView(label) {
    const direct = page.getByRole("button", { name: label, exact: true });
    if (await direct.isVisible()) {
      await direct.click();
    } else {
      await page
        .getByRole("button", { name: "More actions", exact: true })
        .click();
      await page.getByRole("menuitem", { name: label, exact: true }).click();
    }
  }
  async function appearance() {
    return page
      .locator(".worksheetGameAppearance .math-minigame")
      .evaluate((card) => {
        const style = getComputedStyle(card);
        const title = getComputedStyle(card.querySelector("h2"));
        return {
          width: card.getBoundingClientRect().width,
          padding: style.padding,
          margin: style.margin,
          minHeight: style.minHeight,
          border: style.border,
          radius: style.borderRadius,
          shadow: style.boxShadow,
          grid: style.backgroundImage,
          gridSize: style.backgroundSize,
          titleSize: title.fontSize,
          titleMarginTop: title.marginTop,
          titleMarginBottom: title.marginBottom,
          titleMarginLeft: parseFloat(title.marginLeft),
          titleMarginRight: parseFloat(title.marginRight),
          drawings: getComputedStyle(
            card
              .closest(".worksheetGameAppearance")
              .querySelector(".worksheetSprinkles"),
          ).opacity,
        };
      });
  }
  for (const width of [2400, 1440, 621, 620, 601, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator(".sidebar + .ant-layout")).toHaveCSS(
      "margin-left",
      width < 768 ? "0px" : "240px",
    );
    const editor = await appearance();
    const actionSpace = width <= 600 ? 70 : 74;
    expect(editor.drawings).toBe("0.22");
    await expect(page.locator(".worksheetGameFrame")).toHaveCSS(
      "padding-right",
      `${actionSpace}px`,
    );
    await switchView("Preview as child");
    const preview = await appearance();
    if (width <= 620) {
      // Phone previews reclaim the editor action space; titles stay centered as they wrap.
      const {
        width: editorWidth,
        titleMarginLeft: editorLeft,
        titleMarginRight: editorRight,
        ...editorStyles
      } = editor;
      const {
        width: previewWidth,
        titleMarginLeft: previewLeft,
        titleMarginRight: previewRight,
        ...previewStyles
      } = preview;
      expect(previewStyles).toEqual(editorStyles);
      expect(previewWidth).toBeCloseTo(editorWidth + actionSpace, 1);
      expect(editorLeft).toBeCloseTo(editorRight, 1);
      expect(previewLeft).toBeCloseTo(previewRight, 1);
    } else {
      expect(preview).toEqual(editor);
    }
    await expect(page.locator(".worksheetGameFrame")).toHaveCSS(
      "padding-right",
      width <= 620 ? "0px" : `${actionSpace}px`,
    );
    await expect(page.locator(".worksheetCardAction")).toHaveCount(0);
    await expect(
      page.locator(".worksheetSprinkles > g").first(),
    ).toBeAttached();
    await switchView("Back to editor");
  }
});

test("dashboard sharing opens the correct code without navigating to the editor", async ({
  page,
}) => {
  await mockPlatform(page);
  await page.goto("/home");
  await page.getByRole("button", { name: "Share worksheet: Practice" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole("dialog").getByText("ORIGINAL", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
  await page.getByRole("link", { name: "Practice 1 activity" }).click();
  await expect(page).toHaveURL(/\/teacher\/20$/);
});

test("teacher editor shares saved worksheets from its tools panel", async ({
  page,
}) => {
  await mockPlatform(page);
  await page.goto("/teacher/20");
  const share = page
    .locator(".worksheetToolbarExpanded")
    .getByRole("button", { name: "Share worksheet", exact: true });
  await share.click();
  await expect(
    page.getByRole("dialog").getByText("ORIGINAL", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/teacher\/20$/);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page
    .getByLabel("Worksheet name", { exact: true })
    .fill("Updated practice");
  await expect(share).toBeDisabled();
  await page
    .getByRole("button", { name: "Save worksheet", exact: true })
    .click();
  await expect(share).toBeEnabled();
  await share.click();
  await expect(
    page.getByRole("dialog").getByText("ORIGINAL", { exact: true }),
  ).toBeVisible();
});

test("worksheet card opens from its background while share and delete stay on the list", async ({
  page,
}) => {
  await mockPlatform(page);
  await page.goto("/sheets");
  const name = page.locator(".worksheetOpenButton");
  await name.waitFor();
  await page.mouse.move(0, 0);
  const nameBefore = await name.boundingBox();
  const cardBefore = await page.locator(".worksheet-card").boundingBox();
  await name.hover();
  await expect(name).toHaveCSS("color", "rgb(108, 92, 231)");
  await expect(name).toHaveCSS("padding", "0px");
  expect(await name.boundingBox()).toEqual(nameBefore);
  expect(await page.locator(".worksheet-card").boundingBox()).toEqual(
    cardBefore,
  );
  await page
    .locator(".worksheet-card")
    .getByText("1 activity", { exact: true })
    .click();
  await expect(page).toHaveURL(/\/teacher\/20$/);
  await page.goto("/sheets");
  await page.getByRole("button", { name: "Share worksheet: Practice" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/sheets$/);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete worksheet: Practice" })
    .click();
  await expect(
    page.getByText("Delete this worksheet?", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sheets$/);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("removal stays in the draft, supports undo and can save an empty worksheet", async ({
  page,
}) => {
  const state = await mockPlatform(page);
  await page.goto("/teacher/20");
  await page.getByRole("heading", { name: "Easy math", exact: true }).click();
  await page.getByRole("button", { name: "Remove activity" }).click();
  await expect(
    page.getByRole("button", { name: "Save worksheet", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(state.changes).toHaveLength(0);
  await page.getByRole("button", { name: "Undo removal" }).click();
  await expect(page.getByRole("heading", { name: "Easy math" })).toBeVisible();
  expect(state.changes).toHaveLength(0);
  await page.locator(".worksheetGameFrame").hover();
  await page.getByRole("button", { name: "Remove activity" }).click();
  await page
    .getByRole("button", { name: "Save worksheet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save worksheet", exact: true }),
  ).toBeDisabled();
  expect(state.worksheet.items).toEqual([]);
  expect(
    state.changes.filter((entry) => entry.method === "DELETE"),
  ).toHaveLength(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Add activity", exact: true }),
  ).toBeVisible();
});

test("leaving without saving preserves server activities", async ({ page }) => {
  const state = await mockPlatform(page);
  await page.goto("/teacher/20");
  await page.getByRole("heading", { name: "Easy math" }).click();
  await page.getByRole("button", { name: "Remove activity" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("menuitem", { name: "Account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  expect(state.worksheet.items).toHaveLength(1);
  expect(state.changes).toHaveLength(0);
});

test("retry after a partial save keeps IDs and selects the latest catalog version for new activities", async ({
  page,
}) => {
  const state = await mockPlatform(page, {
    empty: true,
    failSecondCreate: true,
  });
  await page.goto("/teacher/20");
  await addMath(page);
  await addMath(page);
  await page
    .getByRole("button", { name: "Save worksheet", exact: true })
    .click();
  await expect(
    page.getByText("Connection lost", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save worksheet", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save worksheet", exact: true }),
  ).toBeDisabled();
  expect(state.changes.filter((entry) => entry.method === "POST")).toHaveLength(
    2,
  );
  expect(state.worksheet.items.map((item) => item.id)).toEqual([40, 41]);
  expect(state.worksheet.items.map((item) => item.miniGameId)).toEqual([2, 2]);
});

test("saving an existing activity keeps its original catalog version", async ({
  page,
}) => {
  const state = await mockPlatform(page);
  await page.goto("/teacher/20");
  await page
    .getByLabel("Worksheet name", { exact: true })
    .fill("Renamed practice");
  await page
    .getByRole("button", { name: "Save worksheet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save worksheet", exact: true }),
  ).toBeDisabled();
  expect(state.worksheet.items[0].miniGameId).toBe(1);
});

test("language switching translates game and navigation without losing unsaved edits", async ({
  page,
}) => {
  await mockPlatform(page);
  await page.goto("/teacher/20");
  await page
    .getByLabel("Worksheet name", { exact: true })
    .fill("Keep this draft");
  await page.getByLabel("Language", { exact: true }).click();
  await page.getByText("Română", { exact: true }).click();
  await expect(page.getByLabel("Numele fișei", { exact: true })).toHaveValue(
    "Keep this draft",
  );
  await expect(
    page.getByRole("heading", { name: "Matematică ușoară" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvează fișa", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Modificări nesalvate", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
});

test("share dialog explains saved versions and confirms before replacing a code", async ({
  page,
}) => {
  const state = await mockPlatform(page);
  await page.goto("/sheets");
  await page
    .getByRole("button", { name: "Share worksheet: Practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ORIGINAL", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This code opens a saved version. Later edits do not change what children receive.",
    ),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Publish latest and replace code" })
    .click();
  expect(state.changes).toHaveLength(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(state.changes).toHaveLength(0);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Publish latest and replace code" })
    .click();
  await page
    .getByRole("tooltip")
    .getByRole("button", { name: "Publish latest and replace code" })
    .click();
  await expect(
    page.getByRole("heading", { name: "FRESHCODE", exact: true }),
  ).toBeVisible();
  expect(state.changes).toHaveLength(1);
});

test("editor toolbar stays at the top and keeps mobile actions usable", async ({
  page,
}, testInfo) => {
  await mockPlatform(page, { many: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/teacher/20");
  const name = page.getByLabel("Worksheet name", { exact: true });
  const save = page.getByRole("button", {
    name: "Save worksheet",
    exact: true,
  });
  await expect(name).toBeVisible();
  await expect(save).toBeDisabled();
  await expect(page.locator(".worksheetTools")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(name).toBeInViewport();
  await expect(save).toBeInViewport();
  expect((await page.locator(".sidebar-header").boundingBox()).y).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath("editor-toolbar-desktop.png"),
  });
  await name.fill("Updated worksheet");
  await expect(save).toBeEnabled();
  await expect(page.getByText("Unsaved changes", { exact: true })).toHaveCount(
    0,
  );
  await page.keyboard.press("Control+s");
  await expect(save).toBeDisabled();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      )
      .toBe(true);
    await expect(name).toBeInViewport();
    await expect(save).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByText("Worksheet saved successfully.", { exact: true })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await expect(
    page.getByRole("menuitem", { name: "Share worksheet" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("editor-toolbar-mobile.png"),
    animations: "disabled",
  });
  await page.getByRole("menuitem", { name: "Share worksheet" }).click();
  await expect(
    page.getByRole("dialog").getByText("ORIGINAL", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Preview as child" }).click();
  await expect(name).toBeDisabled();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Back to editor" }).click();
  await expect(name).toBeEnabled();
});

test("teacher editor fits a phone and exposes accessible navigation", async ({
  page,
}, testInfo) => {
  await mockPlatform(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/teacher/20");
  await expect(
    page.getByLabel("Worksheet name", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Worksheets" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close navigation" }).first().click();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator(".sidebar")).toHaveCSS("width", "240px");
  await page.screenshot({ path: testInfo.outputPath("sidebar-mobile.png") });
  await page.getByRole("menuitem", { name: "Worksheets" }).click();
  await expect(page).toHaveURL(/\/sheets$/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({
    path: testInfo.outputPath("editor-mobile.png"),
    fullPage: true,
  });
});

test("desktop navigation starts expanded, remembers collapse and highlights the current page", async ({
  page,
}, testInfo) => {
  await mockPlatform(page);
  await page.goto("/teacher/20");
  const sidebar = page.locator(".sidebar");
  await expect(sidebar).toHaveCSS("width", "240px");
  await expect(
    page.getByRole("link", { name: "Practica · Home" }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Worksheets" })).toHaveClass(
    /ant-menu-item-selected/,
  );
  const main = await page.locator(".sidebar-menu--main").boundingBox();
  const footer = await page.locator(".sidebar-footer").boundingBox();
  expect(footer.y).toBeGreaterThan(main.y + main.height + 100);
  await page.screenshot({ path: testInfo.outputPath("sidebar-desktop.png") });
  await page.getByRole("button", { name: "Close navigation" }).click();
  await expect(sidebar).toHaveCSS("width", "80px");
  await page.getByRole("menuitem", { name: "Worksheets" }).hover();
  await expect(page.getByRole("tooltip", { name: "Worksheets" })).toBeVisible();
  await page.reload();
  await expect(sidebar).toHaveCSS("width", "80px");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("menuitem", { name: "Worksheets" }).click();
  await expect(page).toHaveURL(/\/sheets$/);
  await expect(sidebar).toHaveCSS("width", "240px");
  await page.getByRole("menuitem", { name: "Account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("menuitem", { name: "Account" })).toHaveClass(
    /ant-menu-item-selected/,
  );
});
