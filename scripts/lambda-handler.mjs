// AWS Lambda handler shim for TanStack Start (Node server target).
//
// TanStack Start's `node-server` target produces a standalone HTTP server
// (run with `node index.mjs`) — it does NOT export a fetch handler.
//
// This shim:
//   1. Spawns `index.mjs` as a child process on a fixed local port (once per container)
//   2. Waits up to 10 s for it to be ready
//   3. Proxies each Lambda Function URL / API Gateway v2 event to it via Node's fetch
//   4. Returns the response back to Lambda
//
// Lambda config:
//   Runtime : Node.js 20.x
//   Handler : lambda.handler
//   (Lambda Function URL or API GW v2 HTTP in front)

import { Buffer } from "node:buffer";
import { createConnection } from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const SERVER_ENTRY = resolve(__dirname, "index.mjs");

// ─── Child-process lifecycle ──────────────────────────────────────────────────

let _ready = false;

function waitForPort(port, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      const sock = createConnection({ port, host: "127.0.0.1" });
      sock.setTimeout(400);
      sock.on("connect", () => { sock.destroy(); resolve(); });
      sock.on("timeout", () => { sock.destroy(); retry(); });
      sock.on("error", () => retry());
    }
    function retry() {
      if (Date.now() >= deadline) {
        reject(new Error(`Server on port ${port} not ready after ${timeoutMs} ms`));
      } else {
        setTimeout(attempt, 250);
      }
    }
    attempt();
  });
}

async function ensureServer() {
  if (_ready) return;

  const child = spawn(process.execPath, [SERVER_ENTRY], {
    env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => process.stderr.write(d));
  child.on("error", (err) => console.error("[shim] Child process error:", err));
  child.on("exit", (code) => {
    console.warn(`[shim] Server exited with code ${code} — next invocation will restart it`);
    _ready = false;
  });

  await waitForPort(PORT);
  _ready = true;
  console.log(`[shim] TanStack Start server ready on port ${PORT}`);
}

// ─── Request / response helpers ───────────────────────────────────────────────

export async function handler(event) {
  try {
    await ensureServer();

    const method = event.requestContext?.http?.method ?? event.httpMethod ?? "GET";
    const rawPath = event.rawPath ?? event.requestContext?.http?.path ?? "/";
    const qs = event.rawQueryString ? `?${event.rawQueryString}` : "";
    const url = `http://127.0.0.1:${PORT}${rawPath}${qs}`;

    const reqHeaders = { ...(event.headers ?? {}) };
    if (event.cookies?.length) reqHeaders["cookie"] = event.cookies.join("; ");
    // Prevent keep-alive issues inside a Lambda container
    reqHeaders["connection"] = "close";

    let body;
    if (event.body != null && method !== "GET" && method !== "HEAD") {
      body = event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : event.body;
    }

    const res = await fetch(url, { method, headers: reqHeaders, body, redirect: "manual" });

    const resCookies = [];
    const resHeaders = {};
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") resCookies.push(value);
      else resHeaders[key] = value;
    });

    const buf = Buffer.from(await res.arrayBuffer());
    const ct = resHeaders["content-type"] ?? "";
    const isText =
      ct.startsWith("text/") ||
      ct.includes("json") ||
      ct.includes("xml") ||
      ct.includes("javascript") ||
      ct.includes("svg");

    return {
      statusCode: res.status,
      headers: resHeaders,
      ...(resCookies.length ? { cookies: resCookies } : {}),
      isBase64Encoded: !isText,
      body: isText ? buf.toString("utf8") : buf.toString("base64"),
    };
  } catch (err) {
    console.error("[shim] Handler error:", err);
    return {
      statusCode: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: `Internal Server Error\n${err?.message ?? ""}`,
    };
  }
}
