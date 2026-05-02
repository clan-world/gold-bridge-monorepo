import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: '../..',
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 5173),
    allowedHosts: ['localhost', '127.0.0.1', 'bridge-dev.clan-world.com'],
  }
});
