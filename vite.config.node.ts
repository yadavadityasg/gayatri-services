// Node container build. Used by scripts/build-node.mjs.
// vite.config.ts stays on Cloudflare (Lovable). vite.config.aws.ts stays on Lambda.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const routesDirectory = path.resolve(process.cwd(), ".surface/routes");

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      router: {
        routesDirectory,
        generatedRouteTree: path.resolve(process.cwd(), "src/routeTree.gen.ts"),
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
});
