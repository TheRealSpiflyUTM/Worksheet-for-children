# Backend

Three separate modules on this branch: `minigame1`, `minigame`, and `auth`.
They run in the same Spring Boot application. Authentication has its own
`auth_users` table and does not change access to the existing minigame APIs.

## Run

Requirements: Java 25 and Docker Desktop. Maven is included through the wrapper.

Start Docker Desktop, then run this from the repository root:

```powershell
docker compose up -d postgres
```

Open a terminal in `backend/backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend address: `http://localhost:8080`.

## How the code works

- **Controller** receives requests from the frontend or an API client.
- **Service** does the work and prepares the response.
- **Repository** saves and reads database records through Spring Data JPA.
- **Entity** describes a database table; a **response** contains fields sent to the client.

Java modules are in `src/main/java/com/worksheet`.
Backend settings are in `src/main/resources/application.properties`.

## Database connection

```text
Spring Boot -> Spring Data JPA -> PostgreSQL in Docker
```

| Setting | Value |
| --- | --- |
| Container | `worksheets-postgres` |
| PostgreSQL version | 18 |
| Host / port | `localhost:5432` |
| Database | `worksheets` |
| Username | `postgres` |
| Password | The configured `POSTGRES_PASSWORD` in the root `docker-compose.yml` |
| JDBC URL | `jdbc:postgresql://localhost:5432/worksheets` |
| Schema | `public` |

The backend's `spring.datasource.password` must match the database password.
These connection settings assume the backend runs on your computer and
PostgreSQL runs in Docker.

The `minigame1` and `auth_users` tables share this database but store separate
records. JPA creates or updates their structure at startup using
`spring.jpa.hibernate.ddl-auto=update`. The earlier H2 file database is no
longer used for application data; H2 is used only by the default tests.

PostgreSQL files are stored in the root `database/postgres-data` folder,
mounted into the container at `/var/lib/postgresql`. They are ignored by Git.
Do not edit these files directly. Accounts remain saved after restarting the
backend or container.

To inspect tables with Microsoft's PostgreSQL extension in VS Code, connect
using the settings above and expand:

```text
worksheets -> Schemas -> public -> Tables
```

Right-click `auth_users` or `minigame1` and select **Select Top 1000**.
Refresh the Tables folder if a newly created table is missing.

## 1. Minigame1

Saves an animal name and an uploaded image.

```text
Frontend -> Controller -> Service -> PostgreSQL + image folder
```

Records are in the `minigame1` table. Images are in `backend/backend/data/uploads`.

| Request | Send | Receive |
| --- | --- | --- |
| `POST /api/minigame1` | Form data: `name` and `image` file | Saved entry |
| `GET /api/minigame1` | Nothing | Array of saved entries |
| `GET /api/minigame1/{id}/image` | Entry ID in the URL | Image file |

Example saved entry:

```json
{
  "id": 1,
  "name": "Cat",
  "imageUrl": "/api/minigame1/1/image",
  "createdAt": "2026-09-15T19:00:00Z"
}
```

## 2. Minigame list

Returns the available minigame descriptions from a fixed list in Java.

```text
Client -> MiniGameController -> MiniGameService -> Prepared list
```

| Request | Receive |
| --- | --- |
| `GET /api/mini-games` | Array of minigame descriptions |

Example response:

```json
[
  { "id": "addition", "name": "Addition", "description": "Practice adding two numbers." },
  { "id": "animal-body-parts", "name": "Animal Body Parts", "description": "Identify parts of an animal." }
]
```

## 3. Authentication

Creates accounts, checks login details, remembers signed-in users, and logs them out.

```text
Client -> AuthController -> AuthService -> UserRepository -> PostgreSQL auth_users
```

All authentication code is in `src/main/java/com/worksheet/auth`.

| File | Responsibility |
| --- | --- |
| `AuthController.java` | Endpoints, session handling, request header checks, and authentication error responses |
| `AuthService.java` | Validate input, hash passwords, and check credentials |
| `UserRepository.java` | Read and save users through Spring Data JPA |
| `User.java` | Map the `auth_users` table |
| `UserResponse.java` | Return public account fields without the password hash |

### Stored user data

| Column | Purpose |
| --- | --- |
| `id` | Automatically generated user ID |
| `name` | Display name, 1–100 characters after trimming |
| `email` | Unique email, trimmed and lowercased, at most 254 characters |
| `password_hash` | Salted PBKDF2-HMAC-SHA256 hash; never the original password |
| `created_at` | Account creation time |

Passwords must contain 15–128 characters. Spring Security Crypto hashes them
with a random 16-byte salt and 600,000 iterations. Only the crypto library is
added; there is no global Spring Security filter changing other endpoints.
Create accounts through signup so validation and hashing are applied.
Do not enter a plain password directly into `password_hash`.

### Requests

| Request | Send | Receive |
| --- | --- | --- |
| `POST /api/auth/signup` | JSON: `name`, `email`, `password` | `201`: saved user and a session cookie |
| `POST /api/auth/login` | JSON: `email`, `password` | `200`: user and a session cookie |
| `GET /api/auth/me` | Session cookie | `200`: current user; `401` if not signed in |
| `POST /api/auth/logout` | Session cookie | `204`: session invalidated, no response body |

All authentication POST requests require `X-Auth-Request: 1`.
Signup and login also require `Content-Type: application/json`.

Example signup body:

```json
{
  "name": "Example User",
  "email": "example.user@example.com",
  "password": "ExamplePassphrase2026!"
}
```

For login, send only `email` and `password`. Signup, login, and `/me` return
the same public user structure:

```json
{
  "id": 1,
  "name": "Example User",
  "email": "example.user@example.com",
  "createdAt": "2026-09-18T08:00:00Z"
}
```

### Sessions and client connection

- Signup automatically signs the new user in. Login checks the stored password hash.
- The session cookie is named `WORKSHEET_SESSION`, with `HttpOnly`,
  `SameSite=Strict`, and path `/api/auth`. The session ID changes on authentication.
- Sessions expire after 30 minutes without a session-bearing auth request or
  when the backend restarts. Logout invalidates the server session.
- Browser requests from `http://localhost:5173` are allowed for authentication.
  Set `app.auth.allowed-origin` in backend settings to change that origin.
- A future frontend connection must use `credentials: 'include'` in `fetch`
  to send and receive the session cookie across localhost ports, and include
  `X-Auth-Request: 1` on POST requests. Use the same hostname on both sides
  (`localhost` on both, rather than mixing it with `127.0.0.1`).
- For HTTPS deployment, set `AUTH_COOKIE_SECURE=true`. The current cookie
  settings assume the client and API are on the same site.

No frontend authentication screens or integration were added on this branch.
The existing minigame endpoints remain public. Roles, email verification,
password reset, and login rate limiting are not implemented.

### Authentication errors

| Status | Meaning |
| --- | --- |
| `400` | Missing or invalid account fields |
| `401` | Incorrect credentials, missing session, or expired session |
| `403` | Missing required request header or rejected cross-origin request |
| `409` | Email already registered |

Validation and authentication errors raised by the module return a `message`,
for example:

```json
{ "message": "Email or password is incorrect." }
```

## Previous branch: Count & Match

These notes are preserved from the original README in commit `7acf50a`.
The `countmatch` module and its endpoints are **not present on this branch**.

Returns random images from a category.

```text
Frontend -> Controller -> Service -> Prepared image folders
```

Images are in `data/Count & Mathc (MiniGame)/Images` on that earlier branch.
Categories: `animals`, `fruits`, `shapes`, `toys`, `vegetables`.

| Request | Receive |
| --- | --- |
| `GET /api/count-match/categories` | Array of category names |
| `GET /api/count-match/images?category=vegetables&count=5` | Array of 5 random image URLs, without duplicates |
| `GET /api/count-match/images/{category}/{filename}` | Image file |

Example response when `count=2`:

```json
[
  "/api/count-match/images/vegetables/image-r1-c1.png",
  "/api/count-match/images/vegetables/image-r3-c2.png"
]
```

Both `category` and `count` are required. Count must be at least 1 and cannot
exceed the available images. The frontend handles counting and matching.

## Frontend notes

- Add `http://localhost:8080` before an image URL when requesting it directly from the backend.
- Minigame1 allows browser requests from `http://localhost:5173`.
  The minigame-list controller does not currently configure cross-origin access.
- Authentication has its own origin and cookie requirements, described above.
- `400` means invalid input; `404` means not found; `500` means a backend error.
- Backend settings are in `src/main/resources/application.properties`.

## Tests

From `backend/backend`, run:

```powershell
.\mvnw.cmd test
```

Default tests use in-memory H2 databases, not the saved PostgreSQL users.
They cover signup, password hashing, validation, duplicate emails, login,
sessions, logout, cross-origin requests, and existing Minigame1 behavior.

`AuthTests` also accepts `-Dauth.test.database-url=jdbc:postgresql://localhost:5432/TEST_DATABASE`
for PostgreSQL testing. Use only a separate disposable test database: these
tests create/drop tables and delete test users. Never point them at `worksheets`.
