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

// Expected layout after build:
//   .output/server/index.mjs   ← Node server entry produced by tanstack-start
//   .output/public/            ← static assets
const serverDir = resolve(root, ".output/server");
const publicDir = resolve(root, ".output/public");

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
} else {
  console.warn("⚠ .output/public not found — no static assets to upload.");
}

console.log("✅ AWS build complete.");
