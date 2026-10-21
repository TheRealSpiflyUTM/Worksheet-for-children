# Production build from the repository root: docker build -t practica-production .
# Development continues to use docker-compose.yml and the two existing Dockerfiles.
FROM node:24-bookworm-slim AS frontend-build
WORKDIR /build/my-react
COPY my-react/package.json my-react/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY my-react/ ./
# Vite writes the website to ../backend/src/main/resources/static.
RUN npm run build

FROM eclipse-temurin:25-jdk AS backend-build
WORKDIR /build/backend
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN ./mvnw -B dependency:go-offline
COPY backend/src/ src/
COPY ["backend/data/Count & Mathc (MiniGame)/Images/", "data/Count & Mathc (MiniGame)/Images/"]
COPY backend/data/uploads/754f189b-b7eb-410c-923d-9d3690251b9a.png backend/data/uploads/a17f14db-469c-4bde-9d30-f210d40d4576.png data/uploads/
COPY --from=frontend-build /build/backend/src/main/resources/static/ src/main/resources/static/
RUN ./mvnw -B clean package

FROM eclipse-temurin:25-jre AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app app
WORKDIR /app
COPY --from=backend-build --chown=app:app /build/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
# Copy only bundled images, including the sample uploads referenced by migrations.
COPY --from=backend-build --chown=app:app ["/build/backend/data/Count & Mathc (MiniGame)/Images/", "data/Count & Mathc (MiniGame)/Images/"]
COPY --from=backend-build --chown=app:app /build/backend/data/uploads/754f189b-b7eb-410c-923d-9d3690251b9a.png /build/backend/data/uploads/a17f14db-469c-4bde-9d30-f210d40d4576.png data/uploads/
RUN mkdir -p data/uploads data/minigame-assets && chown -R app:app /app
USER app
# Production is served behind HTTPS; these defaults do not affect Docker Compose.
ENV AUTH_COOKIE_SECURE=true \
    SERVER_FORWARD_HEADERS_STRATEGY=framework
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD curl --fail --silent "http://127.0.0.1:${PORT:-8080}/api/auth/csrf" || exit 1
# Render provides PORT. The default also permits standalone local smoke checks.
ENTRYPOINT ["sh", "-c", "exec java -XX:MaxRAMPercentage=60.0 -jar app.jar --server.port=\"${PORT:-8080}\""]
