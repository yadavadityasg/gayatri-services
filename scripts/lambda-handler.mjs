// AWS Lambda handler shim for TanStack Start.
//
// Uses dynamic import() to avoid Node ESM's static named-export check,
// which throws "does not provide an export named 'handler'" at link time
// when the export name doesn't exactly match.
//
// Also injects security response headers on every response.
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
// Try common export names used by Nitro / TanStack Start.
const mod = await import("./server.js");
const appHandler =
  mod.handler ??
  mod.fetch ??
  mod.default?.handler ??
  mod.default?.fetch ??
  (typeof mod.default === "function" ? mod.default : null);

if (typeof appHandler !== "function") {
  const available = Object.keys(mod).join(", ") || "(none)";
  const defaultType = typeof mod.default;
  throw new Error(
    `[lambda-handler] Could not find a callable handler in server.js.\n` +
    `Available named exports: ${available}\n` +
    `Default export type: ${defaultType}`
  );
}

console.log("[lambda-handler] Handler resolved from server.js ✓");

export async function handler(event, context) {
  const response = await appHandler(event, context);
  if (response && typeof response === "object" && "headers" in response) {
    response.headers = { ...(response.headers ?? {}), ...SECURITY_HEADERS };
  }
  return response;
}
