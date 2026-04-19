// AWS Lambda handler shim for TanStack Start (Node server target).
// Converts API Gateway v2 / Lambda Function URL events ↔ standard Request/Response.
//
// Lambda config:
//   Runtime: Node.js 20.x
//   Handler: lambda.handler
//   (Function URL or API Gateway v2 HTTP API in front)

import { Buffer } from "node:buffer";

// The TanStack Start node-server target exports a fetch-style handler.
// Resolve it lazily so cold-start cost is paid once.
let _appHandler;
async function getAppHandler() {
  if (_appHandler) return _appHandler;
  const mod = await import("./index.mjs");
  _appHandler =
    mod.default?.fetch ??
    mod.fetch ??
    mod.handler ??
    mod.default;
  if (typeof _appHandler !== "function") {
    throw new Error(
      "Could not locate fetch handler in .output/server/index.mjs (expected default.fetch, fetch, handler, or default export).",
    );
  }
  return _appHandler;
}

function buildRequest(event) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(event.headers ?? {})) {
    if (v !== undefined) headers.set(k, String(v));
  }
  if (event.cookies?.length) {
    headers.set("cookie", event.cookies.join("; "));
  }

  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("host") ?? "lambda.local";
  const rawPath = event.rawPath ?? event.requestContext?.http?.path ?? "/";
  const qs = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const url = `${proto}://${host}${rawPath}${qs}`;

  const method =
    event.requestContext?.http?.method ?? event.httpMethod ?? "GET";

  let body;
  if (event.body != null && method !== "GET" && method !== "HEAD") {
    body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
  }

  return new Request(url, { method, headers, body });
}

async function buildLambdaResponse(res) {
  const headers = {};
  const cookies = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") cookies.push(value);
    else headers[key] = value;
  });

  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "";
  const isText =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("javascript") ||
    contentType.includes("svg");

  return {
    statusCode: res.status,
    headers,
    cookies: cookies.length ? cookies : undefined,
    isBase64Encoded: !isText,
    body: isText ? buf.toString("utf8") : buf.toString("base64"),
  };
}

export async function handler(event) {
  try {
    const app = await getAppHandler();
    const request = buildRequest(event);
    const response = await app(request);
    return await buildLambdaResponse(response);
  } catch (err) {
    console.error("Lambda handler error:", err);
    return {
      statusCode: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: `Internal Server Error\n${err?.message ?? ""}`,
    };
  }
}
