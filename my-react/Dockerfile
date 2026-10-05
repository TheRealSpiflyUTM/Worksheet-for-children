FROM node:24-bookworm-slim
WORKDIR /app
COPY . .
EXPOSE 5173
# Install into the container volume, never the host's node_modules.
# Running npm ci at startup also picks up teammates' lockfile changes.
CMD ["sh", "-c", "npm ci --no-audit --no-fund && exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort"]
