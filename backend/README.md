# Worksheet Backend

This backend is one Spring Boot modular monolith backed by PostgreSQL. Editable worksheets are separated from immutable published revisions, so assignments and completed history do not change when a worksheet is edited later.

## Module map

```text
com.worksheet
├── auth                 users, roles, sessions, admin bootstrap/API
├── classroom            classrooms and membership lifecycle
├── minigame             dynamic catalog, versions, schemas and asset links
├── worksheet            editable worksheet drafts and items
│   ├── revision         immutable published worksheet snapshots
│   └── result           deprecated result compatibility API
├── assignment           per-user grants to frozen revisions
├── attempt              canonical attempt and scoring lifecycle
├── minigame1            legacy game adapter
├── countmatch           legacy game adapter
└── shared
    ├── errors           stable JSON errors and request IDs
    ├── security         Spring Security, CORS and CSRF
    └── storage          replaceable asset storage contract
```

Each feature keeps the `controller -> service -> repository -> entity` flow. Controllers translate HTTP, services own authorization and transactions, repositories only query persistence, and response records keep JPA entities out of the API.

## Domain and database

```text
auth_users (USER / TEACHER / ADMIN)
  ├──< worksheet (editable, owned)
  │      ├──< worksheet_item (editable)
  │      └──< worksheet_revision (immutable publication)
  │              └──< worksheet_revision_item (frozen game + configuration)
  │                      └──< worksheet_attempt
  │                              └──< worksheet_attempt_item_result
  ├──< classroom (teacher-owned)
  │      └──< classroom_member >── USER
  └── worksheet_assignment
          ├── one assigned USER
          ├── optional classroom
          └── one immutable worksheet_revision

mini_game_definition (type + version + JSON Schemas)
  ├──< worksheet_item
  ├──< worksheet_revision_item
  └──< mini_game_definition_asset >── mini_game_asset
```

Only `worksheet` stores worksheet ownership. An assignment derives its worksheet and teacher through `worksheet_revision -> worksheet -> auth_users`; it does not duplicate those foreign keys. Child access is checked through these parent relationships.

Publishing occurs when an assignment is created or a personal attempt starts. A SHA-256 content hash reuses the latest unchanged revision. A changed name, item order, definition version, or configuration creates the next revision. Published rows are never edited.

The old `worksheet_result` and `mini_game_result` tables/routes remain as deprecated compatibility APIs. New work uses `worksheet_attempt` and `worksheet_attempt_item_result`.

## Attempt lifecycle

```text
POST worksheet/assignment attempts
        |
        v
  IN_PROGRESS on a frozen revision
        |
        +-- PUT each item result (COMPLETED or SKIPPED)
        |      - membership and score bounds checked
        |      - details checked against the definition result schema
        |      - repeated PUT replaces that item while in progress
        |
        +-- POST complete
               - every revision item must have a result
               - backend sums totalScore and maxScore
               - status becomes COMPLETED and immutable

membership removal -> active assignment revoked -> unfinished attempts ABANDONED
                                      completed history remains readable by teacher
```

The client reports each dynamic game's item score because the backend cannot reproduce arbitrary frontend game logic. The backend controls revision membership, schemas, non-negative numeric bounds, `score <= maxScore`, completeness, lifecycle state, and aggregate totals.

## Authorization matrix

| Capability | USER | TEACHER | ADMIN |
| --- | --- | --- | --- |
| Signup/login and personal worksheets | Yes | Yes | Yes |
| Create/join classroom | Join | Create/manage | No special classroom bypass |
| Assign an owned worksheet | No | Yes | No implicit teacher bypass |
| Play a received assignment | Yes | No | No |
| Read assignment attempts | Own active assignment | Assignments created through owned worksheets | No global bypass |
| Read active public catalog | Public | Public | Public |
| Create/version/activate catalog entries | No | No | Yes |
| Upload/delete catalog assets | No | No | Yes |
| Manage account roles | No | No | Yes |

Missing authentication returns `401`, insufficient role returns `403`, inaccessible or cross-user resources return `404`, and lifecycle/data conflicts return `409`.

## Security

- Spring Security stores authentication in the existing `WORKSHEET_SESSION` HTTP session.
- Login/signup rotate the session ID. Logout invalidates it.
- The cookie is `HttpOnly`, `SameSite=Strict`, scoped to `/api`, and can be made secure with `AUTH_COOKIE_SECURE=true`.
- `GET /api/auth/csrf` returns the standard token. Send it as the returned header (normally `X-XSRF-TOKEN`) on mutating requests.
- CORS allows one configured frontend origin and credentials.
- Public signup can select `USER` or `TEACHER`, never `ADMIN`.
- Every JSON error has `code`, `message`, `fieldErrors`, `requestId`, and `timestamp`.

Example browser sequence:

```text
GET  /api/auth/csrf              credentials: include
POST /api/auth/login             credentials: include + X-XSRF-TOKEN
POST /api/worksheets/42/attempts credentials: include + X-XSRF-TOKEN
```

## Canonical APIs

| Route | Purpose |
| --- | --- |
| `POST /api/worksheets/{id}/attempts` | Start a personal attempt and publish/reuse a revision |
| `POST /api/assignments/{id}/attempts` | Assigned USER starts an attempt |
| `GET /api/attempts/{id}` | Frozen content, progress, results and totals |
| `PUT /api/attempts/{attemptId}/items/{revisionItemId}/result` | Idempotently save/replace an item result |
| `POST /api/attempts/{id}/complete` | Validate completeness and aggregate totals |
| `GET /api/worksheets/{id}/attempts` | Personal attempt history |
| `GET /api/assignments/{id}/attempts` | Assigned history visible to user/teacher |

Item result example:

```json
{
  "outcome": "COMPLETED",
  "score": 3,
  "maxScore": 5,
  "timeSeconds": 12,
  "details": { "moves": 4 }
}
```

Use `"outcome":"SKIPPED"` with score zero for an explicit skip.

Worksheet draft routes retain their existing paths. `PUT /api/worksheets/{id}` edits a worksheet name; item update/delete remains nested below the worksheet. Assignment and classroom routes also retain their existing paths.

## Dynamic mini-game catalog

Definitions are identified by stable `type` plus positive `version`. Configuration and result payloads are validated with NetworkNT's Jackson 3-compatible JSON Schema Draft 2020-12 implementation. Remote `$ref` values are rejected. Once a worksheet draft or immutable revision references a definition version, its contract cannot be edited; create a higher version.

Public `GET /api/minigames` returns active versions only. Admin APIs can list all definitions and create, edit unused versions, activate, or deactivate them. Definition metadata supports a description, optional thumbnail, and logical asset keys.

Assets are verified from magic bytes (not the submitted MIME header), limited to supported image/audio formats and 10 MB, hashed with SHA-256, and stored through `MiniGameAssetStorage`. Local disk is the default implementation; an S3-compatible implementation can replace it without changing catalog services. Referenced assets cannot be deleted.

`minigame1` and `countmatch` are legacy adapters and remain behavior-compatible. New games use the dynamic catalog.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/worksheets` | PostgreSQL JDBC URL |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Local-development fallback; set a secret in deployed environments |
| `AUTH_COOKIE_SECURE` | `false` | Use `true` behind HTTPS |
| `APP_CSRF_ENABLED` | `true` | Keep enabled outside isolated tests |
| `APP_BOOTSTRAP_ADMIN_NAME` | empty | Optional first-admin display name |
| `APP_BOOTSTRAP_ADMIN_EMAIL` | empty | Optional first-admin email |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | empty | Optional first-admin password (15–128 characters) |

All three admin bootstrap values must be supplied together. Creation is idempotent. Startup fails if the email already belongs to a non-admin account; the application never silently promotes it and never logs the password.

File paths and the allowed frontend origin are configured in `src/main/resources/application.properties`. Hibernate Open Session in View is disabled.

## Migrations

Flyway migrations are forward-only. Never rewrite V1–V13 or another migration already applied to a shared database.

- V14 adds `ADMIN` and optimistic locking to editable worksheet/classroom rows.
- V15 publishes/backfills immutable worksheet revisions, attaches assignments to revisions, then removes duplicate assignment teacher/worksheet columns.
- V16 creates attempts and item results and copies existing results while preserving their IDs and scores.
- V17 adds catalog metadata, asset integrity/lifecycle fields, and relational definition asset keys.

The V13 upgrade migration can only snapshot the worksheet content available at upgrade time because older edits were not historically stored. Existing result history is preserved and linked to that snapshot.

## Run and verify

Requirements: Temurin Java 25 and Docker Desktop.

```powershell
# repository root
docker compose up -d postgres

# backend directory
.\mvnw.cmd spring-boot:run
```

Verification:

```powershell
.\mvnw.cmd clean compile
.\mvnw.cmd test
.\mvnw.cmd verify
```

Fast tests use isolated H2 schemas with Flyway disabled. `verify` additionally runs Testcontainers PostgreSQL tests for a fresh V1-to-latest migration, Hibernate schema validation, and a populated V13-to-latest upgrade. PostgreSQL integration tests are skipped with an explicit JUnit skip when Docker is unavailable.
