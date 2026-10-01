# Worksheet for kids

A React frontend and Spring Boot backend for worksheets, mini-games, classrooms,
assignments, and saved attempts. The backend requires PostgreSQL and applies Flyway
migrations at startup.

## Requirements

- Java JDK 25.
- Node.js 24 LTS and npm.
- Docker Desktop running Linux containers (for the local PostgreSQL database and integration tests).

Check `java -version`, `node -v`, and `docker version`. Maven is downloaded by the backend wrapper.

## Start the website

From the repository root in PowerShell:

```powershell
docker compose up -d postgres
cd my-react
npm ci
npm run build
cd ../backend
.\mvnw.cmd clean spring-boot:run
```

Open http://localhost:8080. Stop the backend with Ctrl+C.
The frontend build writes to `backend/src/main/resources/static`, which Spring Boot serves.
Rebuild the frontend and restart the backend after changing frontend code in this mode.

PostgreSQL uses `localhost:5432`, database `worksheets`, username `postgres`, and
password `postgres` by default. Its data persists in `database/postgres-data`.
Use `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` to connect to a different database.

## Develop with automatic frontend updates

From the repository root, start PostgreSQL and the backend:

```powershell
docker compose up -d postgres
cd backend
.\mvnw.cmd clean spring-boot:run
```

In a second terminal, from the repository root:

```powershell
cd my-react
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to the backend on port 8080.

## Children play with codes

Teachers sign up, create a class, and add children by name using **Adaugă elev**.
Each child receives a personal code; no child email, password, or signup is required.
For existing class members, use **Generează cod** to enable code entry.

Use **Începe un test** in the class to select a worksheet and obtain its code.
Children enter their personal code and the worksheet code on the public home page.
Unfinished attempts resume, and completed scores are saved under the child in the class.
Click a child's name, then a test, to see question results; breadcrumbs return to the class.
Removing a child revokes access while retaining results for the teacher.

Restart the backend after updating so Flyway applies V21, which adds personal access codes.

## Build and verify the backend

With Docker Desktop running, from `backend`:

```powershell
.\mvnw.cmd clean verify
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

The JAR requires a running PostgreSQL database. To include frontend changes, run
`npm run build` in `my-react` before building the JAR.

Regular tests catch duplicate migration versions without Docker. Full verification
also checks migrations, upgrades with existing data, Hibernate mappings, and HTTP
startup using disposable PostgreSQL containers. These PostgreSQL tests are skipped
when Docker is unavailable, so a build with skipped tests is not full verification.

## Migration startup troubleshooting

The worksheet-sharing migration is V19; the task-image migration is V20. After
pulling this correction, use `clean` in the Maven command so an old V19 task-image
file cannot remain in `target/classes`.

If startup reports a database connection error, check `docker compose ps` and
`docker compose logs postgres`, and confirm the backend database settings.

For migration history or checksum errors, inspect the database's
`flyway_schema_history` before making changes. A database that previously ran the
task-image feature branch with task images recorded as V19 needs separate
reconciliation; do not delete the database or its migration history to bypass the error.

## Structure

- `backend/`: Spring Boot source, Flyway migrations, tests, and Maven wrapper.
- `my-react/`: React source and Vite build configuration.
- `docker-compose.yml`: local PostgreSQL service.
- `database/postgres-data/`: local database files managed by PostgreSQL.
- `Project/`: legacy build artifacts; use `backend` and `my-react` for current development.

See [backend documentation](backend/README.md) for architecture, API configuration,
and migration details, and [task image documentation](backend/TASK_IMAGES.md) for image APIs.
