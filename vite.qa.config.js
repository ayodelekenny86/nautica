// Throwaway config for visual QA only: builds the harness page on its own, with
// no service worker (the app's PWA plugin registers one in dev and a stale SW
// was serving old chunks to the QA browser).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // QA runs against no backend: the hooks subscribe to Realtime when a Supabase
  // project is configured, and those sockets never settle on this machine, which
  // left the page loading for 40s. A render check needs no server.
  return {
    define: {
      'import.meta.env.VITE_SUPABASE_PROJECT_REF': '""',
      'import.meta.env.VITE_SUPABASE_URL': '""',
      'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
      'import.meta.env.VITE_API_BASE': '""',
    },
    plugins: [react()],
    build: {
      outDir: 'qa-dist',
      emptyOutDir: true,
      rollupOptions: { input: { harness: 'qa-harness.html', hooks: 'qa-hooks.html' } },
    },
    server: { port: 5220, strictPort: true, host: '127.0.0.1' },
    preview: { port: 5220, strictPort: true, host: '127.0.0.1' },
  };
});
