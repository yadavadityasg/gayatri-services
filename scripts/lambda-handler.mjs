// AWS Lambda handler shim for TanStack Start.
//
// TanStack Start's aws-lambda build emits a `fetch(request)` handler that
// expects a Web `Request` object — NOT the raw API Gateway / Lambda Function
// URL `event`. We convert the event → Request here, call the app, then
// convert the Response → Lambda response payload.
//
// Lambda config:
//   Runtime : Node.js 20.x
//   Handler : lambda.handler

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Dynamic import avoids static export validation at link time.
const mod = await import("./server.js");
const appHandler =
  mod.fetch ??
  mod.handler ??
  mod.default?.fetch ??
  mod.default?.handler ??
  (typeof mod.default === "function" ? mod.default : null);

if (typeof appHandler !== "function") {
  const available = Object.keys(mod).join(", ") || "(none)";
  throw new Error(
    `[lambda-handler] Could not find a callable handler in server.js. Available exports: ${available}`,
  );
}

console.log("[lambda-handler] Handler resolved from server.js ✓");

/** Build a Web Request from an API Gateway v2 / Lambda Function URL event. */
function eventToRequest(event) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(event.headers ?? {})) {
    if (v != null) headers.set(k, String(v));
  }

  const host =
    event.requestContext?.domainName ??
    headers.get("host") ??
    "lambda.local";
  const proto =
    headers.get("x-forwarded-proto") ??
    event.headers?.["x-forwarded-proto"] ??
    "https";

  const rawPath = event.rawPath ?? event.requestContext?.http?.path ?? "/";
  const rawQuery = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const url = `${proto}://${host}${rawPath}${rawQuery}`;

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

/** Convert a Web Response into a Lambda Function URL response payload. */
async function responseToLambda(response) {
  const headers = {};
  for (const [k, v] of response.headers.entries()) headers[k] = v;
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers[k] = v;

  const contentType = response.headers.get("content-type") ?? "";
  const isText =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("javascript") ||
    contentType.includes("svg");

  const buf = Buffer.from(await response.arrayBuffer());

  return {
    statusCode: response.status,
    headers,
    body: isText ? buf.toString("utf8") : buf.toString("base64"),
    isBase64Encoded: !isText,
  };
}

export async function handler(event) {
  try {
    const request = eventToRequest(event);
    const response = await appHandler(request);
    return await responseToLambda(response);
  } catch (err) {
    console.error("[lambda-handler] Error:", err);
    return {
      statusCode: 500,
      headers: { "content-type": "text/plain", ...SECURITY_HEADERS },
      body: `Internal Server Error: ${err?.message ?? "unknown"}`,
      isBase64Encoded: false,
    };
  }
}
