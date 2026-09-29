# Littleleaf frontend

A bilingual React application for teachers and students. Ant Design controls share a calm teal theme; the layout and activity player work on mobile, tablet, and desktop. English/Romanian is selected from the browser initially and can be changed at any time.

## Run

Use Node.js 24 and npm. Start PostgreSQL and the backend as described in the root README, then:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173. API requests are proxied to Spring Boot on port 8080.
`npm run build` replaces the generated frontend inside `../backend/src/main/resources/static`; public images and sounds are copied from `public`.

## Workflows

- Teachers create worksheets, configure activities, preview without saving results, share revision-pinned codes, create classes, assign work, and review student attempts.
- Students sign in, join a worksheet or class by code, and start or resume assignments. Each completed/skipped activity is saved separately. Reloading restarts only an unfinished activity.
- All accounts retain personal worksheets and practice. Administration is available through the existing backend APIs, not through new administration screens.
- Draft saves preserve the selected definition IDs and all existing configuration. Reorders temporarily move existing items beyond occupied positions before final ordering. Successful item IDs/deletions are retained after a partial failure so retry does not duplicate them. A failed save remains dirty; do not refresh or leave before retrying.
- Published share codes keep their original content. The explicit publish/replace action rotates the code to a new saved snapshot; previous assignments remain unchanged.
- Task image controls follow the backend's image-slot metadata. Teacher uploads, catalog variants, and the teacher's paginated image library are supported. Referenced images render in play/preview. Inactive game versions remain readable through authorized worksheet/attempt responses.
- Unknown game types are preserved and clearly marked; they can be skipped during an attempt. New game logic needs a frontend adapter in `game-model.js`/`Game.jsx`; JSON Schema alone does not define game behavior. The five built-in games submit empty result details, matching their seeded result schemas.

## Source layout

`src/app` contains shared session/localization state, pages, worksheet configuration, the editor, and the activity player. `src/api/platform.js` is the domain API and `client.js` handles cookies, CSRF, structured failures, and expired sessions. User-authored worksheet names and content are never translated. Unknown backend validation messages receive a localized status fallback and retain the request ID.

The editor uses the pinned definition's schema for its controls. Supported form shapes include objects, arrays, strings, numbers, booleans, and enums. The backend is authoritative for validation. Unsupported schema composition is retained rather than used to infer new game behavior.

## Verify

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests require Chrome and a running frontend/backend against an **isolated test database**: they register disposable teacher/student accounts and create data. `E2E_BASE_URL` defaults to `http://localhost:5173`; set it to `http://localhost:8080` to verify the built app. Set `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` for the optional image/catalog test; without those credentials that test is explicitly skipped. The image test creates a new game definition version and deactivates it after use. No credentials are saved in the repository.

Tests cover language persistence, protected routes, mobile overflow, teacher/student workflows, pinned revisions, persisted attempt totals, failed-save retries, image uploads/reuse, unsupported activities, ordering/deletion, session expiry, and inactive definitions. Screenshots/traces are written to ignored `test-results` directories.

Run `./mvnw.cmd clean verify` from `backend` for authorization, attempts, sharing, assets, and PostgreSQL migration/schema checks. Clean builds remove stale migration copies from prior branches.
