#!/usr/bin/env node
// Builds the app for AWS Lambda + S3 deployment.
// Usage: node scripts/build-aws.mjs
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("▶ Building TanStack Start (Node server target) for AWS Lambda…");
execSync("bunx vite build --config vite.config.aws.ts", {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, NODE_ENV: "production" },
});

// Debug: show what was actually produced
import { readdirSync } from "node:fs";
console.log("▶ Build output contents:");
try {
  for (const entry of readdirSync(resolve(root, ".output"))) {
    console.log("  .output/" + entry);
  }
} catch {
  console.warn("  (could not read .output dir)");
}

// Expected layout after build:
//   .output/server/index.mjs   ← Node server entry produced by tanstack-start
//   .output/public/            ← static assets (may also be .output/client/)
const serverDir = resolve(root, ".output/server");
// TanStack Start may emit static assets to either .output/public or .output/client
const publicDir = existsSync(resolve(root, ".output/public"))
  ? resolve(root, ".output/public")
  : resolve(root, ".output/client");

if (!existsSync(serverDir)) {
  console.error("✗ .output/server not found. Build did not produce a Node server bundle.");
  process.exit(1);
}

// Copy the Lambda adapter shim alongside the server bundle
const handlerSrc = resolve(__dirname, "lambda-handler.mjs");
const handlerDest = resolve(serverDir, "lambda.mjs");
cpSync(handlerSrc, handlerDest);
console.log(`✓ Copied lambda handler → ${handlerDest}`);

// Write a minimal package.json so Lambda treats the bundle as ESM
writeFileSync(
  resolve(serverDir, "package.json"),
  JSON.stringify({ type: "module" }, null, 2),
);

// Zip the server bundle for `aws lambda update-function-code`
const zipPath = resolve(root, ".output/lambda.zip");
console.log("▶ Zipping Lambda bundle…");
execSync(`cd ${serverDir} && zip -qr ${zipPath} .`, { stdio: "inherit" });
console.log(`✓ Lambda zip: ${zipPath}`);

if (existsSync(publicDir)) {
  console.log(`✓ Static assets ready at: ${publicDir}`);
  // Write a marker file so the workflow knows where assets are
  writeFileSync(resolve(root, ".output/static-assets-dir.txt"), publicDir);
} else {
  console.warn("⚠ No static assets directory found — skipping asset marker.");
}

console.log("✅ AWS build complete.");
