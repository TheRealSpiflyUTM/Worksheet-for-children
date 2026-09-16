import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  // Development configuration
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  // Production configuration
  build: {
    outDir: "../backend/src/main/resources/static",
    emptyOutDir: true,
  },
});