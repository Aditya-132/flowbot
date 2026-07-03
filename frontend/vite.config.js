import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies API + webhook calls to the backend on :3001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // polling avoids ENOSPC when the OS inotify watcher limit is exhausted;
    // remove if you raise fs.inotify.max_user_watches and prefer lower CPU use
    watch: { usePolling: true },
    proxy: {
      "/api": "http://localhost:3001",
      "/whatsapp": "http://localhost:3001",
      "/meta": "http://localhost:3001",
      "/green": "http://localhost:3001",
      "/whapi": "http://localhost:3001",
    },
  },
});
