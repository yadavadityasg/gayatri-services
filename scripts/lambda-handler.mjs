// AWS Lambda handler shim for TanStack Start (aws-lambda target).
//
// With `target: "aws-lambda"`, Nitro emits .output/server/index.mjs that
// exports a { handler } function compatible with API Gateway v2 / Lambda
// Function URLs. This shim just re-exports it so we can set the Lambda
// Handler config to `lambda.handler` independently of the build output name.
//
// Lambda config:
//   Runtime : Node.js 20.x
//   Handler : lambda.handler

export { handler } from "./index.mjs";
