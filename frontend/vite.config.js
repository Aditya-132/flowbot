import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies API + webhook calls to the backend on :3001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/whatsapp": "http://localhost:3001",
    },
  },
});
