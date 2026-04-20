// AWS Lambda handler shim for TanStack Start (aws-lambda target).
//
// With `target: "aws-lambda"`, Nitro emits .output/server/server.js (not index.mjs)
// that exports a { handler } function compatible with API Gateway v2 / Lambda
// Function URLs. This shim re-exports it so the Lambda Handler stays `lambda.handler`.
//
// Lambda config:
//   Runtime : Node.js 20.x
//   Handler : lambda.handler

export { handler } from "./server.js";
