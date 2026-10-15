# New Teammate Onboarding Guide

This guide explains how to start the project, understand its main parts, work safely
with the database, run checks, and submit a change. Start here on your first day.

## 1. What this project is

Worksheet for kids is a web application where teachers create worksheets and classes,
children play assigned activities, and the application stores attempts and results.

The project is one repository with three development services:

| Service  | Technology                       | Address from your computer |
| -------- | -------------------------------- | -------------------------- |
| Frontend | React, Vite, JavaScript          | http://localhost:5173      |
| Backend  | Java 25, Spring Boot, Maven      | http://localhost:8080      |
| Database | PostgreSQL 18, Flyway migrations | `localhost:5433`           |

Docker connects the backend to PostgreSQL internally at `postgres:5432`. Port `5433`
is only the host-computer port, chosen to avoid conflicts with an existing PostgreSQL
installation.

## 2. What to install

For the recommended workflow, install only:

- Git, or GitHub Desktop if that is how you work with Git.
- Docker Desktop running Linux containers. On Windows, Docker Desktop may ask you to
  enable WSL 2 during installation.
- A code editor such as VS Code.
- A modern web browser.

You do **not** need to install Java, Maven, Node.js, npm, or PostgreSQL locally when you
use the Docker workflow. The repository contains the Maven wrapper, and Docker images
provide the other runtimes.

## 3. Clone and start the application

Open PowerShell in the directory where you keep projects:

```powershell
git clone https://github.com/TheRealSpiflyUTM/Worksheet-for-children.git
cd Worksheet-for-children
docker compose up --build -d
docker compose ps
```

The first build can take several minutes because Docker downloads base images and
installs dependencies. Wait until the services report healthy, then open:

- Application: http://localhost:5173
- Backend readiness endpoint: http://localhost:8080/api/auth/csrf

Useful startup diagnostics:

```powershell
docker compose ps
docker compose logs -f frontend backend postgres
```

Press `Ctrl+C` to stop following logs. The containers continue to run in the
background.

## 4. How startup works

```text
PostgreSQL becomes healthy
          |
          v
Spring Boot starts and Flyway applies pending migrations
          |
          v
Vite starts and forwards browser /api requests to Spring Boot
```

Use `http://localhost:5173` in the browser during development. Names such as
`postgres` and `backend` are private Docker network names, not browser addresses.

## 5. Everyday commands

Run these commands from the repository root:

```powershell
# Start existing containers
docker compose up -d

# Rebuild after backend, Docker, or migration changes
docker compose up --build -d backend

# Refresh frontend dependencies after package-lock.json changes
docker compose restart frontend

# Follow all application logs
docker compose logs -f frontend backend postgres

# Stop the development stack
docker compose down
```

Frontend source is bind-mounted into the container, so Vite normally updates the page
automatically after a file is saved.

After pulling teammates' changes, use:

```powershell
git switch main
git pull --ff-only
docker compose up --build -d
docker compose restart frontend
docker compose ps
```

## 6. Repository map

```text
Worksheet-for-children/
|- backend/                 Spring Boot application, tests and Flyway migrations
|- my-react/                React/Vite frontend and frontend tests
|- database/postgres-data/ Local PostgreSQL files; ignored by Git
|- .github/workflows/       GitHub Actions continuous-integration configuration
|- docker-compose.yml       Local three-service development stack
|- README.md                Short project setup and command reference
|- ONBOARDING.md            This teammate guide
`- Project/                 Legacy build artifacts; do not use for current work
```

The current application lives in `backend/` and `my-react/`. Do not add new work to
the legacy `Project/` directory.

## 7. Backend and database architecture

The backend is a modular monolith: one Spring Boot application and one PostgreSQL
database, separated into feature packages instead of separate microservices.

```text
Account (USER, TEACHER or ADMIN)
|-- owns editable Worksheet drafts
|     `-- Worksheet items use versioned mini-game definitions
|-- TEACHER owns Classrooms
|     `-- Classroom members receive worksheet assignments
`-- starts Worksheet attempts
      `-- Per-item mini-game results produce the final score

Worksheet draft --publish--> Immutable worksheet revision
                                |-- assignment
                                `-- attempt history

Mini-game catalog
|-- definition type and version
|-- configuration schema
|-- result schema
`-- protected image/audio assets
```

Important distinction:

- A **worksheet draft** is the teacher's editable copy.
- An **immutable worksheet revision** is a frozen snapshot made when content is shared,
  assigned, or played.
- A **revision item** is the frozen version of one worksheet item inside that snapshot.
- A **worksheet attempt** is one play-through. Its mini-game results point to frozen
  revision items, so later edits cannot change the meaning of an old score.

Ownership is stored at the correct parent level. Child records derive access through
their worksheet, revision, assignment, or attempt instead of duplicating a user ID in
every table.

Read [backend/README.md](backend/README.md) for the complete module map, authorization
matrix, API routes, CSRF/session behavior, dynamic mini-game contracts, and database
migration history. Read [backend/TASK_IMAGES.md](backend/TASK_IMAGES.md) before changing
task-image support.

## 8. Local data and database safety

Local state is deliberately outside Git:

- PostgreSQL data: `database/postgres-data/`
- Uploaded backend files: `backend/data/`
- Frontend dependencies: Docker volume `frontend-node-modules`

Rebuilding or stopping containers does not erase these folders. Each teammate has
their own accounts, worksheets, uploads, and results.

Do not delete `database/postgres-data`, edit `flyway_schema_history`, or run
`flyway repair` as a general troubleshooting step. Back up valuable local data and
investigate the migration error first. Any intentional database reset destroys local
application data and should be agreed with the affected teammate.

Development credentials are `postgres` / `postgres` for database `worksheets`. These
are local defaults only and must never be reused in a deployed environment.

## 9. Flyway migration rules

Flyway owns the PostgreSQL schema. Migration files are under:

`backend/src/main/resources/db/migration/`

Rules for every database change:

1. Add a new, forward-only migration with the next unused version.
2. Never edit or rename a migration that may already have run on another database.
3. Preserve existing rows unless the feature explicitly has an approved data-removal
   plan.
4. Add or update migration tests for important schema and upgrade behavior.
5. Run the backend verification with Docker before opening a pull request.

The migration sequence includes both SQL and Java migrations, so inspect the entire
migration directory before choosing the next version number.

## 10. Run checks before a pull request

With the development containers running, frontend checks require no host Node.js:

```powershell
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build -- --outDir /tmp/worksheet-frontend-build
```

The temporary build directory prevents a test build from changing Spring Boot's
committed static resources.

Backend unit tests can also run without a host JDK:

```powershell
docker build --target build -t worksheet-backend-check ./backend
docker run --rm --entrypoint ./mvnw worksheet-backend-check -B test
```

For the complete backend verification, install Temurin JDK 25, keep Docker running,
and run:

```powershell
cd backend
.\mvnw.cmd clean verify
```

`verify` uses Testcontainers for disposable PostgreSQL integration tests. PostgreSQL
does not need to be configured as a separate local test service; Docker creates and
removes the test containers. Tests can be skipped when Docker is unavailable, so read
the Maven output and do not call a skipped integration run a complete verification.

## 11. Git and pull-request workflow

Do not develop directly on `main`. Begin from its latest version:

```powershell
git switch main
git pull --ff-only
git switch -c feature/short-description
```

After implementing and testing the change:

```powershell
git status
git add <files-you-intentionally-changed>
git commit -m "type: concise description"
git push -u origin feature/short-description
```

Open a pull request into `main`, describe the behavior and tests, and wait for all
required checks. Avoid staging unrelated editor files, local data, secrets, or build
outputs.

Suggested commit prefixes include `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, and
`ci:`.

## 12. What continuous integration checks

GitHub Actions runs on pull requests and pushes to `main`:

- **Frontend:** installs from the lockfile, runs tests, and creates a production build.
- **Backend:** uses Java 25 and runs `Maven clean verify`, including PostgreSQL
  Testcontainers when Docker is available on the runner.
- **Docker smoke test:** builds the full Compose stack, checks service health, and runs
  browser end-to-end tests with Playwright.

Dependabot checks GitHub Actions versions weekly and may open automatic dependency
pull requests. It is a GitHub bot, not a teammate's local process. Treat its pull
requests like any other dependency update: inspect the change and require green CI.

CI checks the combined pull-request state, not only isolated commits. This catches
changes that passed independently but fail when used together.

## 13. Configuration and secrets

Useful backend environment variables include:

| Variable                       | Development default                           | Purpose                                     |
| ------------------------------ | --------------------------------------------- | ------------------------------------------- |
| `DB_URL`                       | `jdbc:postgresql://localhost:5432/worksheets` | Database URL                                |
| `DB_USERNAME`                  | `postgres`                                    | Database user                               |
| `DB_PASSWORD`                  | `postgres`                                    | Development-only database password          |
| `AUTH_COOKIE_SECURE`           | `false`                                       | Set to `true` behind production HTTPS       |
| `APP_CSRF_ENABLED`             | `true`                                        | CSRF protection; keep enabled outside tests |
| `APP_BOOTSTRAP_ADMIN_NAME`     | empty                                         | Optional first administrator name           |
| `APP_BOOTSTRAP_ADMIN_EMAIL`    | empty                                         | Optional first administrator email          |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | empty                                         | Optional first administrator password       |

The application default JDBC port is `5432` for a separately installed host database.
The repository's Compose stack overrides the backend connection to `postgres:5432`.
Host database tools—and a backend started directly on the host while using the Compose
database—must use `localhost:5433`.

Never commit `.env` files, real passwords, API keys, or production connection strings.
All three administrator bootstrap variables must be supplied together.

## 14. Troubleshooting

### A container is unhealthy

```powershell
docker compose ps
docker compose logs --tail=200 postgres backend frontend
```

Read the first relevant error rather than repeatedly restarting the service. The
backend cannot become healthy until PostgreSQL is healthy and migrations succeed.

### A port is already in use

The development stack needs host ports `5173`, `8080`, and `5433`. Stop the local
program using that port, then start Compose again. Do not change shared ports casually;
that would make every teammate's documentation and tooling inconsistent.

### Frontend packages seem stale

```powershell
docker compose restart frontend
docker compose logs -f frontend
```

The frontend runs `npm ci` from the committed lockfile at startup.

### Backend code or a migration changed

```powershell
docker compose up --build -d backend
docker compose logs -f backend
```

### VS Code shows Java errors but Maven succeeds

Treat Maven as the build authority. Open the repository or `backend/` as a Maven
project, select JDK 25, reload Maven projects, and restart the Java language server.
Do not modify correct Java imports merely to silence stale editor diagnostics.

### Flyway reports a checksum or history error

Stop and inspect the exact migration and `flyway_schema_history`. Do not rewrite an
applied migration, delete database files, or run repair blindly. Ask the teammate who
created the migration if its history is unclear.

## 15. First-day checklist

- Clone the repository and start the three healthy Docker services.
- Open the application at http://localhost:5173.
- Create a local teacher account and walk through one worksheet/classroom flow.
- Read the repository map and the backend architecture overview.
- Run at least one frontend check and the backend container test command.
- Create changes on a branch, not directly on `main`.
- Before opening a pull request, review `git status` and run the checks relevant to
  your change.
