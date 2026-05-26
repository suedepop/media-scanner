import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev` the React app runs on :5173. Requests to /api are
// proxied to a locally running Azure Functions host (`func start`, default
// :7071). When you instead run the full stack via the SWA CLI (`npm run
// start:swa`), the SWA emulator handles /api routing and this proxy is unused.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:7071",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
