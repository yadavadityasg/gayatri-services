#!/usr/bin/env node
// Production build for the local Node containers (replaces the Lambda bundle).
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const surface = process.env.APP_SURFACE === "admin" ? "admin" : "app";

const runtime = process.execPath;

console.log(`▶ Staging ${surface} routes…`);
execSync(`"${runtime}" scripts/stage-routes.mjs`, {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, APP_SURFACE: surface },
});

console.log(`▶ Building TanStack Start for the ${surface} container…`);
execSync(`"${runtime}" node_modules/vite/bin/vite.js build --config vite.config.node.ts`, {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, APP_SURFACE: surface, NODE_ENV: "production" },
});

function list(dir) {
  if (!existsSync(dir)) {
    console.log(`  (missing ${dir})`);
    return;
  }
  for (const entry of readdirSync(dir)) console.log(`  ${dir}/${entry}`);
}

console.log("▶ Build output:");
list(resolve(root, "dist"));
list(resolve(root, "dist/server"));
list(resolve(root, "dist/client"));
list(resolve(root, ".output"));
console.log("✅ Node build complete.");
