// AWS Lambda build target — used ONLY by scripts/build-aws.mjs in GitHub Actions.
// Uses the aws-lambda preset so Nitro emits a handler export (not a standalone server).
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
      // aws-lambda preset: Nitro emits index.mjs that exports { handler }
      // so Lambda can invoke it directly without a child-process proxy.
      target: "aws-lambda",
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
