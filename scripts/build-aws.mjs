#!/usr/bin/env node
// Builds the app for AWS Lambda + S3 deployment.
// Usage: node scripts/build-aws.mjs
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function getPackageName(specifier) {
  if (!specifier || specifier.startsWith("node:") || specifier.startsWith(".") || specifier.startsWith("/")) {
    return null;
  }

  if (specifier.startsWith("@")) {
    const [scope, name] = specifier.split("/");
    return scope && name ? `${scope}/${name}` : null;
  }

  return specifier.split("/")[0] ?? null;
}

function getInstalledPackageVersion(packageName) {
  const packageJsonPath = resolve(root, "node_modules", packageName, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return packageJson.version;
}

function getInstalledPackageJson(packageName) {
  const packageJsonPath = resolve(root, "node_modules", packageName, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf8"));
}

function collectRuntimePackages(packageNames) {
  const packages = new Set();
  const queue = [...packageNames];

  while (queue.length > 0) {
    const packageName = queue.shift();
    if (!packageName || packages.has(packageName)) continue;

    const packageDir = resolve(root, "node_modules", packageName);
    if (!existsSync(packageDir)) continue;

    packages.add(packageName);

    const packageJson = getInstalledPackageJson(packageName);
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.peerDependencies ?? {}),
    };

    for (const dependencyName of Object.keys(dependencies)) {
      queue.push(dependencyName);
    }
  }

  return [...packages];
}

function copyPackageToBundle(packageName, serverDir) {
  const sourceDir = resolve(root, "node_modules", packageName);
  const destinationDir = resolve(serverDir, "node_modules", packageName);

  mkdirSync(dirname(destinationDir), { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
}

console.log("▶ Building TanStack Start (aws-lambda target) for AWS Lambda…");
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

// Debug: show what server.js exports
const serverJs = resolve(serverDir, "server.js");
if (existsSync(serverJs)) {
  const content = readFileSync(serverJs, "utf8");
  const allLines = content.split("\n");
  // Last 30 lines (where exports are usually defined in bundled output)
  console.log("▶ Last 30 lines of .output/server/server.js:");
  console.log(allLines.slice(-30).join("\n") + "\n");
  // All lines that start with 'export'
  const exportLines = allLines.filter((l) => l.startsWith("export ") || l.startsWith("export{") || l.startsWith("export {"));
  console.log("▶ Export statements in server.js:");
  console.log(exportLines.join("\n") || "  (none found at line start — may be inline exports)\n");

  const specifierRegex = /\b(?:import|export)\b(?:[^"']*?\bfrom\s*)?["']([^"']+)["']/g;
  const runtimePackages = [...new Set([...content.matchAll(specifierRegex)]
    .map((match) => getPackageName(match[1]))
    .filter(Boolean))];

  if (runtimePackages.length > 0) {
    const bundledRuntimePackages = collectRuntimePackages(runtimePackages);

    console.log("▶ Installing Lambda runtime dependencies:");
    for (const packageName of bundledRuntimePackages) {
      console.log(`  - ${packageName}@${getInstalledPackageVersion(packageName)}`);
      copyPackageToBundle(packageName, serverDir);
    }

    writeFileSync(
      resolve(serverDir, "package.json"),
      JSON.stringify({
        type: "module",
        private: true,
        dependencies: Object.fromEntries(
          bundledRuntimePackages.map((packageName) => [packageName, getInstalledPackageVersion(packageName)]),
        ),
      }, null, 2),
    );
  }
} else {
  console.warn("⚠ .output/server/server.js not found — check build output above");
}

// Copy the Lambda adapter shim alongside the server bundle
const handlerSrc = resolve(__dirname, "lambda-handler.mjs");
const handlerDest = resolve(serverDir, "lambda.mjs");
cpSync(handlerSrc, handlerDest);
console.log(`✓ Copied lambda handler → ${handlerDest}`);

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
