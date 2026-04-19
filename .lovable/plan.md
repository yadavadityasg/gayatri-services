
The user wants me to swap the build target from Cloudflare Workers to AWS Lambda + add GitHub Actions deploy script. Before planning, I need to flag a critical constraint.

## Critical constraint

This Lovable project is locked to the Cloudflare Workers build target. Specifically:
- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config` which **bakes in the Cloudflare adapter** (per the comment: "cloudflare (build-only)") and explicitly forbids adding adapters manually.
- `wrangler.jsonc` configures the Worker entry as `@tanstack/react-start/server-entry`.
- The Lovable preview/publish pipeline itself runs on Cloudflare Workers — changing the adapter would break the in-Lovable preview and the Lovable "Publish" button.

So I **cannot** swap the build target inside the Lovable project itself without breaking the Lovable preview. The right approach is to keep Lovable as-is and do the AWS deploy from the GitHub mirror using a **separate build script** that overrides the adapter at deploy time.

## Proposed plan

### Approach: dual-target via CI override (don't touch vite.config.ts)

Keep the Lovable project running on Cloudflare for preview. Add a parallel AWS build path that runs only in GitHub Actions:

1. **Add `vite.config.aws.ts`** — a separate Vite config that uses the TanStack Start Node/Lambda adapter (`target: 'node-server'`), bypassing `@lovable.dev/vite-tanstack-config`. This file is ignored by Lovable's build.

2. **Add `scripts/build-aws.mjs`** — wraps the build with `vite build --config vite.config.aws.ts` and produces:
   - `.output/server/index.mjs` — Lambda handler (wrapped with a Node `awslambda` adapter shim)
   - `.output/public/` — static assets for S3

3. **Add `scripts/lambda-handler.mjs`** — small adapter that converts API Gateway / Function URL events to the standard `Request`/`Response` the TanStack Node server expects.

4. **Add `.github/workflows/deploy-aws.yml`** — GitHub Actions workflow that:
   - Triggers on push to `main` (and manual dispatch)
   - Installs deps, runs `node scripts/build-aws.mjs`
   - Syncs `.output/public/` → S3 (`aws s3 sync --delete`)
   - Zips `.output/server/` and updates the Lambda function (`aws lambda update-function-code`)
   - Creates a CloudFront invalidation for `/*`
   - Uses OIDC (recommended) or IAM access keys from GitHub Secrets

5. **Add `infra/README.md`** — one-time manual AWS setup steps (S3 bucket name, Lambda function name, CloudFront distribution ID, IAM role/user, GitHub secrets to set).

### Required GitHub Secrets

User must add these in GitHub repo → Settings → Secrets:
- `AWS_ROLE_ARN` (for OIDC) **or** `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (e.g. `us-east-1`)
- `S3_BUCKET` (assets bucket name)
- `LAMBDA_FUNCTION_NAME` (e.g. `tanstack-ssr`)
- `CLOUDFRONT_DISTRIBUTION_ID`

### One-time AWS setup (user does in AWS Console, ~15 min)

1. Create S3 bucket (block public access, enable OAC)
2. Create Lambda function (Node 20, 512 MB, 10s timeout, Function URL enabled)
3. Create CloudFront distribution: default origin = Lambda Function URL; `/assets/*` + `/_build/*` + `/favicon.ico` → S3 origin (OAC)
4. Create IAM role for GitHub OIDC with `s3:PutObject`, `lambda:UpdateFunctionCode`, `cloudfront:CreateInvalidation`
5. Add the secrets above to GitHub

### Files to create

- `vite.config.aws.ts`
- `scripts/build-aws.mjs`
- `scripts/lambda-handler.mjs`
- `.github/workflows/deploy-aws.yml`
- `infra/README.md`

### Files NOT touched

- `vite.config.ts` (stays Cloudflare-only — required by Lovable)
- `wrangler.jsonc` (stays as-is)
- `src/router.tsx` (works on both targets)
- Any application code

### Risks / caveats to flag

- **TanStack Start AWS Lambda adapter is community-maintained** — may need a thin custom handler shim. The Node server entry exists; we wrap it for Lambda Function URL events.
- **Cold starts**: ~300–500ms for first request after idle. For ~$0.20/mo extra, can add provisioned concurrency = 1.
- **Server functions** that depend on Cloudflare-specific bindings would break, but this app uses Supabase via fetch — fully portable.
- **Lovable Cloud (Supabase) stays as the DB** — no migration. The Lambda just calls Supabase over HTTPS like Cloudflare does today.

### After approval, single-message implementation

I'll create all 5 files in one batch. User then does the one-time AWS Console setup using `infra/README.md` and pushes to GitHub — first deploy runs automatically.

Want me to proceed with this dual-target setup, or would you rather skip Lambda entirely and use the **Lightsail $3.50/mo** path (simpler: one VM, `git pull && npm run build && pm2 restart`, no adapter swap needed)?
