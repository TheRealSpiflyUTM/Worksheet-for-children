import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // During development, send API requests to Spring Boot.
    proxy: { '/api': 'http://localhost:8080' },
  },
});
