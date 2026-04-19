// AWS Lambda build target — used ONLY by scripts/build-aws.mjs in GitHub Actions.
// Lovable's preview/publish keeps using vite.config.ts (Cloudflare Workers).
// Do NOT import this from anywhere else.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Node server bundle that we wrap for AWS Lambda
      target: "node-server",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  build: {
    outDir: ".output",
    emptyOutDir: true,
  },
});
