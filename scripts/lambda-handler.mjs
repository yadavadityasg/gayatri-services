// AWS Lambda handler shim for TanStack Start (aws-lambda target).
//
// With `target: "aws-lambda"`, Nitro emits .output/server/server.js (not index.mjs)
// that exports a { handler } function compatible with API Gateway v2 / Lambda
// Function URLs. This shim re-exports it so the Lambda Handler stays `lambda.handler`.
//
// Lambda config:
//   Runtime : Node.js 20.x
//   Handler : lambda.handler

import server from "./server.js";

function buildUrl(event) {
  const host = event.headers?.host ?? event.requestContext?.domainName ?? "localhost";
  const protocol =
    event.headers?.["x-forwarded-proto"] ??
    event.requestContext?.http?.protocol?.split("/")[0]?.toLowerCase() ??
    "https";
  const path = event.rawPath ?? "/";
  const query = event.rawQueryString ? `?${event.rawQueryString}` : "";

  return `${protocol}://${host}${path}${query}`;
}

function encodeBody(text) {
  return Buffer.from(text).toString("base64");
}

function shouldEncodeBody(contentType = "") {
  return !(
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("javascript") ||
    contentType.includes("xml") ||
    contentType.includes("svg") ||
    contentType.includes("form-urlencoded")
  );
}

export async function handler(event) {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? "GET";
  const headers = new Headers();

  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value != null) headers.set(key, value);
  }

  const request = new Request(buildUrl(event), {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : event.body
          ? event.isBase64Encoded
            ? Buffer.from(event.body, "base64")
            : event.body
          : undefined,
  });

  const response = await server.fetch(request);
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();
  const isBase64Encoded = shouldEncodeBody(contentType);

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: isBase64Encoded ? encodeBody(bodyText) : bodyText,
    isBase64Encoded,
  };
}
