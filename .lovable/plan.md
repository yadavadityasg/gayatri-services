
User is getting "internal server error" from CloudFront. This means Lambda is crashing. The most likely causes for our setup:

1. **Lambda missing environment variables** — `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` not set on the Lambda function. The SSR code reads `process.env.SUPABASE_URL` (see `client.server.ts` and `client.ts` server fallback). If unset, throws `"Missing Supabase environment variables"` on first SSR render → Lambda returns 500 → CloudFront shows "internal server error".

2. **Handler path mismatch** — Lambda Handler config must be exactly `lambda.handler` (the shim re-exports from `./server.js`). If it's `index.handler` or `server.handler`, Lambda can't find it.

3. **aws-lambda preset output shape** — TanStack Start with `target: "aws-lambda"` may emit a different file than `server.js`. The build script logs this, but if the export isn't `handler`, the shim breaks.

4. **CloudFront origin request policy** — if the default behavior forwards the `Host` header to Lambda Function URL, Lambda rejects the signature. Must use `AllViewerExceptHostHeader`.

The fastest path forward is to read the actual CloudWatch error, not guess. Plan: walk the user through grabbing the Lambda log and, in parallel, verify the 3 most common config gotchas. No code changes needed yet — this is diagnosis.

## Plan: Diagnose the CloudFront 500

### Step 1 — Get the actual Lambda error (90% of the answer)

1. AWS Console → **CloudWatch** → **Log groups** → `/aws/lambda/<your-function-name>`
2. Open the newest log stream
3. Copy the most recent `ERROR` / stack trace and paste it here

This tells us exactly what's crashing. Without this we're guessing.

### Step 2 — While you're there, verify these 3 things

**A. Lambda environment variables** (Lambda → your function → Configuration → Environment variables). Must have:
   - `SUPABASE_URL` = `https://xsoxhdxuicqibstqufdp.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = (the anon key from `.env`)
   - `SUPABASE_SERVICE_ROLE_KEY` = (get from Lovable Cloud backend settings)
   
   Most common cause of 500 on first request — these are missing.

**B. Lambda Handler string** (Configuration → Runtime settings → Edit). Must be exactly:
   ```
   lambda.handler
   ```
   Not `index.handler`, not `server.handler`.

**C. CloudFront default behavior origin request policy** (CloudFront → distribution → Behaviors → Default `*` → Edit). Must be:
   ```
   AllViewerExceptHostHeader
   ```
   If it's `AllViewer`, Lambda Function URL rejects the request with a signature error.

### Step 3 — Test Lambda directly (bypass CloudFront)

Open the Lambda **Function URL** in your browser (Lambda → Configuration → Function URL → copy URL). 
- If it returns the page → CloudFront config is the problem (Step 2C).
- If it returns 500 → Lambda is the problem (Step 1 + 2A/B).

### What I need from you to fix it

Reply with **one** of:
- The CloudWatch error message/stack trace (best — exact root cause), **or**
- "Function URL also returns 500" + the result of Step 2A (env vars present? yes/no), **or**
- "Function URL works, only CloudFront fails" → I'll fix the CloudFront behavior config

Once I see the actual error, the fix is usually a 1-line config change in the AWS Console — no code edit needed in 90% of cases. If it does turn out to be a code issue (e.g. the aws-lambda preset emitted a different export name), I'll patch `scripts/lambda-handler.mjs` in the next turn.
