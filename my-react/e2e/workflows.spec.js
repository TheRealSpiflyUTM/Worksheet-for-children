import { test, expect } from "@playwright/test";
const password = "a long browser test password";
const stamp = Date.now();
async function request(context, path, method = "GET", data) {
  const headers = {};
  if (method !== "GET") {
    const csrf = await (await context.request.get("/api/auth/csrf")).json();
    headers[csrf.headerName] = csrf.token;
  }
  const response = await context.request.fetch(path, { method, headers, data });
  if (!response.ok())
    throw new Error(
      `${method} ${path}: ${response.status()} ${await response.text()}`,
    );
  return response.status() === 204 ? null : response.json();
}
async function signup(page, role, suffix) {
  await page.goto("/signup");
  await page
    .getByLabel("Name", { exact: true })
    .fill(`${role === "TEACHER" ? "Teacher" : "Student"} ${suffix}`);
  if (role === "USER") await page.getByText("Student", { exact: true }).click();
  await page
    .getByLabel("Email", { exact: true })
    .fill(`${suffix}-${stamp}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/(home|assignments)/);
}
async function selectRomanian(page) {
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByText("RO · Română", { exact: true }).last().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await page.keyboard.press("Escape");
}
test("public pages, protected route, Romanian persistence and responsive layout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/teacher/999");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Learning, a little brighter." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await selectRomanian(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Învățarea, puțin mai luminoasă." }),
  ).toBeVisible();
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/landing-ro-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("teacher creates and shares, student joins, plays, resumes, and teacher reviews frozen results", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signup(page, "TEACHER", "flow-teacher");
  await page
    .getByRole("link", { name: "Classes", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "New class" }).click();
  await page.getByLabel("Class name").fill("Curious minds");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Curious minds" }),
  ).toBeVisible();
  const classCode = await page.locator(".code-text").innerText();
  const classId = Number(page.url().split("/").at(-1));
  await page
    .getByRole("link", { name: "Worksheets", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "New worksheet" }).click();
  await page.getByLabel("Worksheet name").fill("First discoveries");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/\d+/);
  const worksheetId = Number(page.url().split("/").at(-1));
  await page
    .getByRole("button", { name: "Add activity", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: /Easy math.*Version 1$/ })
    .first()
    .click();
  await page.getByLabel("Maximum number", { exact: true }).fill("1");
  for (const operation of ["-", "*", "/"])
    await page
      .getByRole("checkbox", { name: operation, exact: true })
      .uncheck();
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  await page
    .getByRole("button", { name: /Odd or even.*Version/ })
    .first()
    .click();
  await page.getByLabel("Maximum number", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".activity-row")).toHaveCount(2);
  await page.screenshot({
    path: "test-results/editor-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByText("Preview only — progress is not saved."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  expect(
    await request(page.context(), `/api/worksheets/${worksheetId}/attempts`),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const code = await page.locator(".share-code").innerText();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  student.on("pageerror", (e) => errors.push(e.message));
  await student.goto("/");
  await student.getByLabel("Worksheet code").fill(code);
  await student
    .getByRole("button", { name: "Join worksheet", exact: true })
    .last()
    .click();
  await expect(student).toHaveURL(/\/login/);
  await signup(student, "USER", "flow-student");
  await expect(student.getByLabel("Worksheet code")).toHaveValue(code);
  await student
    .getByRole("button", { name: "Join worksheet", exact: true })
    .last()
    .click();
  await expect(student).toHaveURL(/\/assignments\/\d+/);
  const assignmentId = Number(student.url().split("/").at(-1));
  await request(studentContext, "/api/classes/join", "POST", {
    joinCode: classCode,
  });
  // Edit the draft after sharing. The received assignment must keep its original name and content.
  await page.getByLabel("Worksheet name").fill("Later draft");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await student.reload();
  await expect(
    student.getByRole("heading", { name: "First discoveries" }),
  ).toBeVisible();
  await student.getByRole("button", { name: "Start learning" }).click();
  await expect(student).toHaveURL(/\/attempts\/\d+/);
  for (let i = 0; i < 5; i++) {
    await student.getByRole("spinbutton", { name: "Your answer" }).fill("2");
    await student
      .getByRole("button", { name: "Check answer", exact: true })
      .click();
    await expect(student.getByText("Correct!", { exact: true })).toBeVisible();
    await student
      .getByRole("button", {
        name: i === 4 ? "Finish activity" : "Next",
        exact: true,
      })
      .click();
  }
  await expect(student.locator(".result-number")).toContainText("5");
  // Force a failed save. The completed game and score remain available for retry.
  await student.route("**/api/attempts/*/items/*/result", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporary failure" }),
    }),
  );
  await student.getByRole("button", { name: "Save & continue" }).click();
  await expect(student.getByText("Temporary failure")).toBeVisible();
  await student.unroute("**/api/attempts/*/items/*/result");
  await student.getByRole("button", { name: "Save & continue" }).click();
  await expect(student.getByText("Is this number odd or even?")).toBeVisible();
  await student.reload();
  await expect(student.getByText("Is this number odd or even?")).toBeVisible();
  await student
    .getByRole("button", { name: "Skip activity", exact: true })
    .click();
  await student.getByRole("button", { name: "Finish worksheet" }).click();
  await expect(
    student.getByRole("heading", { name: "Well done!" }),
  ).toBeVisible();
  await expect(student.locator(".result-number")).toHaveText("5 / 10");
  await student.setViewportSize({ width: 360, height: 800 });
  expect(
    await student.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await student.screenshot({
    path: "test-results/student-results-mobile.png",
    fullPage: true,
  });
  await page.goto(`/assignments/${assignmentId}`);
  await page.getByRole("link", { name: /Started/ }).click();
  await expect(page.locator(".result-number")).toHaveText("5 / 10");
  // Real classroom assignment through the dialog.
  await page.goto(`/teacher/${worksheetId}`);
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await page.getByRole("combobox").nth(1).click();
  await page.getByText("Curious minds", { exact: true }).last().click();
  await page
    .getByRole("button", { name: "Assign", exact: true })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const assigned = await request(page.context(), "/api/assignments");
  expect(assigned.some((a) => a.classroomId === classId)).toBeTruthy();
  await page.goto("/home");
  await expect(page.locator(".stat-card")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
  await studentContext.close();
});
test("image uploads, library reuse, unsupported activities, failed draft save, and expired session", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Set credentials for an admin in the isolated test database.",
  );
  const admin = await browser.newContext();
  await request(admin, "/api/auth/login", "POST", {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
  });
  const definition = await request(admin, "/api/minigames", "POST", {
    name: "Math with a picture",
    type: "math-game",
    version: Math.floor(Date.now() / 1000),
    configurationSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        maxNumber: { type: "integer", minimum: 1 },
        operations: { type: "array", items: { type: "string", enum: ["+"] } },
        imageAssetId: { type: "integer", minimum: 1 },
      },
      required: ["maxNumber", "operations"],
      "x-image-slots": {
        picture: { path: "/imageAssetId", label: "Picture", allowUpload: true },
      },
    },
    defaultConfiguration: { maxNumber: 1, operations: ["+"] },
    resultSchema: {},
  });
  const unsupported = await request(admin, "/api/minigames", "POST", {
    name: "Future activity",
    type: `future-${stamp}`,
    version: 1,
    configurationSchema: {},
    defaultConfiguration: {},
    resultSchema: {},
  });
  await signup(page, "TEACHER", "image-teacher");
  const worksheet = await request(page.context(), "/api/worksheets", "POST", {
    name: "Pictures",
  });
  await request(
    page.context(),
    `/api/worksheets/${worksheet.id}/items`,
    "POST",
    {
      miniGameId: definition.id,
      orderIndex: 0,
      configuration: definition.defaultConfiguration,
    },
  );
  await request(
    page.context(),
    `/api/worksheets/${worksheet.id}/items`,
    "POST",
    { miniGameId: unsupported.id, orderIndex: 1, configuration: {} },
  );
  await page.goto(`/teacher/${worksheet.id}`);
  await page.getByRole("button", { name: "Choose image", exact: true }).click();
  await page.getByLabel("Upload image").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(
    page.getByText("This image is too large or its format is unsupported."),
  ).toBeVisible();
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("Upload image").setInputFiles({
    name: "picture.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".image-slot-row img")).toBeVisible();
  await page.getByRole("button", { name: "Choose image", exact: true }).click();
  await expect(page.getByRole("button", { name: "picture.png" })).toBeVisible();
  await page.getByRole("button", { name: "picture.png" }).click();
  // First update fails; draft remains dirty and retry persists the image reference.
  await page.route(`**/api/worksheets/${worksheet.id}/items/*`, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Save interrupted" }),
    }),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Save interrupted")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Unsaved changes");
  await page.unroute(`**/api/worksheets/${worksheet.id}/items/*`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".activity-row")).toHaveCount(2);
  await expect(page.locator(".image-slot-row img")).toBeVisible();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator(".task-pictures img")).toBeVisible();
  await page
    .getByRole("button", { name: "Skip activity", exact: true })
    .click();
  await expect(
    page.getByText(
      "This activity is preserved, but this app cannot play it yet.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  // Removing and reordering are persisted, including an unsupported definition.
  await page
    .locator(".activity-row")
    .nth(1)
    .getByRole("button", { name: "Move up" })
    .click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".activity-row").first()).toContainText(
    "Future activity",
  );
  await page
    .locator(".activity-row")
    .first()
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".activity-row")).toHaveCount(1);
  await request(admin, `/api/minigames/${definition.id}`, "DELETE");
  await page.reload();
  await expect(page.getByText("Inactive version")).toBeVisible();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator(".equation")).toHaveText("1 + 1 = ?");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.setViewportSize({ width: 360, height: 850 });
  await selectRomanian(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/editor-ro-mobile.png",
    fullPage: true,
  });
  await request(page.context(), "/api/auth/logout", "POST");
  await page.getByRole("button", { name: "Salvează", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await admin.close();
});
test("all five games score once per question through personal practice", async ({
  page,
}) => {
  await signup(page, "USER", "five-games");
  const definitions = await request(page.context(), "/api/minigames");
  const worksheet = await request(page.context(), "/api/worksheets", "POST", {
    name: "Five discoveries",
  });
  const types = [
    "math-game",
    "sequence-game",
    "higher-lower-game",
    "odd-even-game",
    "color-game",
  ];
  for (let i = 0; i < types.length; i++) {
    const definition = definitions.find(
      (d) => d.type === types[i] && d.version === 1,
    );
    const configuration =
      types[i] === "color-game"
        ? definition.defaultConfiguration
        : {
            ...definition.defaultConfiguration,
            maxNumber: 1,
            ...(types[i] === "math-game" ? { operations: ["+"] } : {}),
          };
    await request(
      page.context(),
      `/api/worksheets/${worksheet.id}/items`,
      "POST",
      { miniGameId: definition.id, orderIndex: i, configuration },
    );
  }
  await page.goto(`/kids/${worksheet.id}`);
  await page.getByRole("button", { name: "Start learning" }).click();
  for (let game = 0; game < types.length; game++) {
    const count = game === 4 ? 3 : 5;
    for (let question = 0; question < count; question++) {
      if (game < 2) {
        await page
          .getByRole("spinbutton", { name: "Your answer" })
          .fill(game === 0 ? "2" : "3");
        await page
          .getByRole("button", { name: "Check answer", exact: true })
          .evaluate((button) => {
            button.click();
            button.click();
          });
      } else if (game === 2)
        await page.getByRole("button", { name: "=", exact: true }).click();
      else if (game === 3)
        await page.getByRole("button", { name: "Odd", exact: true }).click();
      else {
        await page.getByRole("button", { name: /^u$/i }).click();
        await page
          .getByRole("button", { name: "Check answer", exact: true })
          .click();
      }
      await expect(page.getByText("Correct!", { exact: true })).toBeVisible();
      await page
        .getByRole("button", {
          name: question === count - 1 ? "Finish activity" : "Next",
          exact: true,
        })
        .click();
    }
    await expect(page.locator(".result-number")).toHaveText(
      `${count} / ${count}`,
    );
    await page.getByRole("button", { name: "Save & continue" }).click();
  }
  await page.getByRole("button", { name: "Finish worksheet" }).click();
  await expect(page.locator(".result-number")).toHaveText("23 / 23");
  await page.reload();
  await expect(page.locator(".result-number")).toHaveText("23 / 23");
});
test("class codes, revocation, and retained teacher history", async ({
  page,
  browser,
}) => {
  await signup(page, "TEACHER", "revoke-teacher");
  const classroom = await request(page.context(), "/api/classes", "POST", {
    name: "Class lifecycle",
  });
  const definitions = await request(page.context(), "/api/minigames");
  const definition = definitions.find(
    (d) => d.type === "odd-even-game" && d.version === 1,
  );
  const worksheet = await request(page.context(), "/api/worksheets", "POST", {
    name: "Class activity",
  });
  await request(
    page.context(),
    `/api/worksheets/${worksheet.id}/items`,
    "POST",
    {
      miniGameId: definition.id,
      orderIndex: 0,
      configuration: definition.defaultConfiguration,
    },
  );
  const learnerContext = await browser.newContext();
  const learner = await learnerContext.newPage();
  await signup(learner, "USER", "revoke-student");
  await learner.goto("/assignments");
  await learner
    .getByRole("button", { name: "Join worksheet", exact: true })
    .click();
  await learner.getByLabel("Worksheet code").fill("NOTACODE");
  await learner
    .getByRole("dialog")
    .getByRole("button", { name: "Join worksheet", exact: true })
    .click();
  await expect(learner.getByText("Worksheet code not found.")).toBeVisible();
  await learner.getByRole("button", { name: "Close", exact: true }).click();
  await learner.goto("/classes");
  await learner
    .getByRole("button", { name: "Join class", exact: true })
    .click();
  await learner.getByLabel("Class code").fill(classroom.joinCode);
  await learner
    .getByRole("dialog")
    .getByRole("button", { name: "Join class", exact: true })
    .click();
  await expect(
    learner.getByRole("heading", { name: "Class lifecycle", exact: true }),
  ).toBeVisible();
  const [assignment] = await request(
    page.context(),
    `/api/worksheets/${worksheet.id}/assignments`,
    "POST",
    { classroomId: classroom.id },
  );
  const completed = await request(
    learnerContext,
    `/api/assignments/${assignment.id}/attempts`,
    "POST",
  );
  await request(
    learnerContext,
    `/api/attempts/${completed.id}/items/${completed.items[0].id}/result`,
    "PUT",
    { outcome: "SKIPPED", score: 0, maxScore: 5, timeSeconds: 0, details: {} },
  );
  await request(
    learnerContext,
    `/api/attempts/${completed.id}/complete`,
    "POST",
  );
  const active = await request(
    learnerContext,
    `/api/assignments/${assignment.id}/attempts`,
    "POST",
  );
  await learner.goto(`/attempts/${active.id}`);
  await expect(learner.getByText("Is this number odd or even?")).toBeVisible();
  await page.goto(`/classes/${classroom.id}`);
  await page.getByRole("button", { name: "Rotate code", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".code-text")).not.toHaveText(classroom.joinCode);
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "No members yet" }),
  ).toBeVisible();
  await learner
    .getByRole("button", { name: "Skip activity", exact: true })
    .click();
  await expect(learner.getByRole("alert")).toBeVisible();
  const history = await request(
    page.context(),
    `/api/assignments/${assignment.id}/attempts`,
  );
  expect(history.find((a) => a.id === completed.id).status).toBe("COMPLETED");
  expect(history.find((a) => a.id === active.id).status).toBe("ABANDONED");
  await page.goto(`/attempts/${completed.id}`);
  await expect(page.getByRole("heading", { name: "Well done!" })).toBeVisible();
  await learnerContext.close();
});
