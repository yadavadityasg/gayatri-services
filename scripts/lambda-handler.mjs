// AWS Lambda handler — re-exports TanStack Start's handler and injects security headers.
// server.js is built by `bunx vite build --config vite.config.aws.ts` (aws-lambda target).

import { handler as appHandler } from "./server.js";

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export async function handler(event: unknown, context: unknown) {
  const response = await (appHandler as Function)(event, context);
  if (response && typeof response === "object" && "headers" in response) {
    response.headers = { ...(response.headers ?? {}), ...SECURITY_HEADERS };
  }
  return response;
}
