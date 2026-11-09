#!/usr/bin/env node
// Copies the route files for one surface into .surface/routes.
// app  → customer routes only (no /admin)
// admin → /admin plus a / redirect, no shop/booking/account routes
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const surface = process.env.APP_SURFACE === "admin" ? "admin" : "app";
const srcDir = resolve(root, "src/routes");
const dest = resolve(root, ".surface/routes");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

const files = readdirSync(srcDir).filter((name) => /\.(tsx|ts)$/.test(name));
const kept = [];

for (const file of files) {
  if (surface === "app" && file === "admin.tsx") continue;
  if (surface === "admin" && file !== "__root.tsx" && file !== "admin.tsx") continue;

  let source = readFileSync(resolve(srcDir, file), "utf8");
  if (file === "__root.tsx") {
    source = source.replace("../styles.css?url", "../../src/styles.css?url");
  }
  writeFileSync(resolve(dest, file), source);
  kept.push(file);
}

if (surface === "admin") {
  const home = readFileSync(resolve(root, "docker/admin-index.tsx"), "utf8");
  writeFileSync(resolve(dest, "index.tsx"), home);
  kept.push("index.tsx");
}

console.log(`▶ Staged ${surface} routes (${kept.length}): ${kept.sort().join(", ")}`);
