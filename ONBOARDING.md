# New Teammate Guide

This is the starting point for developing Worksheet for kids.

## Project overview

| Service  | Technology                  | Local address         |
| -------- | --------------------------- | --------------------- |
| Frontend | React, Vite, JavaScript     | http://localhost:5173 |
| Backend  | Java 25, Spring Boot, Maven | http://localhost:8080 |
| Database | PostgreSQL 18, Flyway       | `localhost:5433`      |

Install Git, Docker Desktop using Linux containers, and a code editor.

## First startup

```powershell
git clone https://github.com/TheRealSpiflyUTM/Worksheet-for-children.git
cd Worksheet-for-children
docker compose up --build -d
docker compose ps
```

Wait until all services are healthy, then open http://localhost:5173.

If startup fails:

```powershell
docker compose logs --tail=200 postgres backend frontend
```

## Repository structure

```text
Worksheet-for-children/
|- backend/                 Spring Boot source, tests and migrations
|- my-react/                React source and frontend tests
|- database/postgres-data/ Local PostgreSQL data; ignored by Git
|- .github/workflows/       GitHub Actions configuration
|- docker-compose.yml       Local development stack
`- Project/                 Legacy artifacts; do not use for new work
```

## Architecture

The application is a modular monolith: one Spring Boot application and one PostgreSQL
database.

```text
Account (USER, TEACHER or ADMIN)
|-- owns Worksheet drafts
|     `-- Worksheet items use versioned mini-game definitions
|-- TEACHER owns Classrooms
|     `-- Members receive worksheet assignments
`-- starts Worksheet attempts
      `-- Item results produce the final score

Worksheet draft --publish--> Immutable worksheet revision
                                |-- assignment
                                `-- attempt history

Mini-game catalog
|-- definition type and version
|-- configuration and result schemas
`-- protected image/audio assets
```

A worksheet draft is editable. Sharing, assigning, or playing it creates or reuses an
immutable revision: a frozen copy of the worksheet and its items. Attempts and results
reference that copy, so later worksheet edits cannot change historical scores.

Continue with the [system overview](docs/SYSTEM_OVERVIEW.md), then open the focused
[frontend](docs/FRONTEND_ARCHITECTURE.md),
[backend](docs/BACKEND_ARCHITECTURE.md),
[database](docs/DATABASE_ARCHITECTURE.md), or
[Docker](docs/DOCKER_ARCHITECTURE.md) document relevant to your work. The detailed API
and security reference remains in [backend/README.md](backend/README.md).

## Daily development

Run Compose commands from the repository root:

```powershell
# Start
docker compose up -d

# Rebuild backend after Java, configuration, or migration changes
docker compose up --build -d backend

# Refresh dependencies after package-lock.json changes
docker compose restart frontend

# Follow logs
docker compose logs -f frontend backend postgres

# Stop
docker compose down
```

After pulling changes:

```powershell
git switch main
git pull --ff-only
docker compose up --build -d
docker compose restart frontend
docker compose ps
```

Frontend source updates automatically through Vite.

## Local data

- PostgreSQL data: `database/postgres-data/`
- Uploaded files: `backend/data/`
- Frontend dependencies: Docker volume `frontend-node-modules`

These are local development data and are not committed. Do not delete database files,
modify `flyway_schema_history`, or run `flyway repair` to bypass a migration error.

The Compose database is `worksheets` with development username/password
`postgres`/`postgres`. Docker services use `postgres:5432`; host database tools use
`localhost:5433`.

## Database changes

Flyway migrations are in `backend/src/main/resources/db/migration/`.

1. Inspect both SQL and Java migrations for the latest version.
2. Add a new forward-only migration using the next unused version.
3. Never edit or rename an applied migration.
4. Preserve existing data unless deletion is explicitly approved.
5. Add migration and upgrade tests for the change.
6. Run `clean verify` before opening the pull request.

## Tests

Frontend checks:

```powershell
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build -- --outDir /tmp/worksheet-frontend-build
```

Backend unit tests through Docker:

```powershell
docker build --target build -t worksheet-backend-check ./backend
docker run --rm --entrypoint ./mvnw worksheet-backend-check -B test
```

Complete backend verification with JDK 25 and Docker running:

```powershell
cd backend
.\mvnw.cmd clean verify
```

`verify` uses Testcontainers to run PostgreSQL migration and integration tests in
temporary containers. Confirm that Maven did not report those tests as skipped.

## Git workflow

Create every change from an updated `main` branch:

```powershell
git switch main
git pull --ff-only
git switch -c feature/short-description
```

Before opening a pull request:

```powershell
git status
git add <intentional-files>
git commit -m "type: concise description"
git push -u origin feature/short-description
```

Use commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, or `ci:`.
Do not commit local data, secrets, editor files, or build output.

## Continuous integration

Every pull request runs:

- Frontend tests and production build.
- Backend Maven verification with PostgreSQL Testcontainers.
- Full Docker Compose health checks and Playwright browser tests.

Dependabot checks GitHub Actions dependencies weekly. Merge only after required checks
pass and review is complete.

## Troubleshooting

| Problem                                        | Action                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Service is unhealthy                           | Run `docker compose ps` and inspect its logs.                              |
| Port conflict                                  | Free ports `5173`, `8080`, or `5433`, then restart Compose.                |
| Frontend dependencies are stale                | Run `docker compose restart frontend`.                                     |
| Backend or migration changed                   | Run `docker compose up --build -d backend`.                                |
| Flyway history/checksum error                  | Inspect the migration and history; do not repair or delete data blindly.   |
| VS Code reports Java errors but Maven succeeds | Reload the Maven project with JDK 25 and restart the Java language server. |
