# AWS Deploy — One-time setup

This repo deploys to AWS via `.github/workflows/deploy-aws.yml`. Lovable's preview/publish stays on Cloudflare Workers — nothing here touches `vite.config.ts` or `wrangler.jsonc`.

## Architecture

```
CloudFront ── /assets/* /_build/* /favicon.ico ──► S3 (static)
           └─ everything else ──► Lambda Function URL (SSR)
                                       │
                                       ▼
                                  Supabase (unchanged)
```

## 1. Create the S3 bucket (static assets)

- Name: e.g. `myapp-assets-prod`
- Block all public access: ✅ ON
- Bucket versioning: optional
- Later, attach a CloudFront **Origin Access Control (OAC)** so only CloudFront can read it.

## 2. Create the Lambda function (SSR)

- Runtime: **Node.js 20.x**
- Architecture: arm64 (cheaper) or x86_64
- Memory: **512 MB** (raise to 1024 if cold starts feel slow)
- Timeout: **10 seconds**
- Handler: **`lambda.handler`**
- Enable **Function URL**: Auth type `NONE`, CORS off (CloudFront handles it).
- Environment variables: copy any `VITE_SUPABASE_*` / runtime secrets the app needs.
- Initial code: upload any placeholder zip — CI will overwrite on first deploy.

## 3. Create the CloudFront distribution

- **Origin 1 (default)** → Lambda Function URL
  - Origin domain: the Function URL host (e.g. `xxxx.lambda-url.us-east-1.on.aws`)
  - Protocol: HTTPS only
  - Cache policy: **CachingDisabled**
  - Origin request policy: **AllViewerExceptHostHeader**
- **Origin 2** → S3 bucket (with OAC)
- **Behaviors** (in this priority order, all pointing to S3 origin with **CachingOptimized** policy):
  - `/_build/*`
  - `/assets/*`
  - `/favicon.ico`
- Default behavior → Lambda origin, allow all HTTP methods.
- Attach ACM cert + alternate domain name if using a custom domain.
- Note the **Distribution ID** — needed for GitHub secrets.

## 4. IAM for GitHub Actions (OIDC — recommended)

1. IAM → Identity providers → Add `token.actions.githubusercontent.com` (audience `sts.amazonaws.com`).
2. Create role `github-deploy-<repo>` trusting that provider, restricted to your repo:
   ```
   "token.actions.githubusercontent.com:sub": "repo:<owner>/<repo>:ref:refs/heads/main"
   ```
3. Attach an inline policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": ["s3:PutObject","s3:DeleteObject","s3:ListBucket"],
         "Resource": ["arn:aws:s3:::<BUCKET>","arn:aws:s3:::<BUCKET>/*"] },
       { "Effect": "Allow", "Action": ["lambda:UpdateFunctionCode","lambda:GetFunction","lambda:PublishVersion"],
         "Resource": "arn:aws:lambda:<REGION>:<ACCT>:function:<FN_NAME>" },
       { "Effect": "Allow", "Action": ["cloudfront:CreateInvalidation"],
         "Resource": "arn:aws:cloudfront::<ACCT>:distribution/<DIST_ID>" }
     ]
   }
   ```

(If you skip OIDC, create an IAM user with the same policy and use access keys instead.)

## 5. GitHub repo secrets

Settings → Secrets and variables → Actions → **New repository secret**:

| Name | Value |
|---|---|
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET` | bucket name from step 1 |
| `LAMBDA_FUNCTION_NAME` | function name from step 2 |
| `CLOUDFRONT_DISTRIBUTION_ID` | distribution ID from step 3 |
| `AWS_ROLE_ARN` *(OIDC)* | role ARN from step 4 — **OR** ↓ |
| `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | if not using OIDC |

## 6. Deploy

Push to `main` (or run the workflow manually). The job:

1. Installs deps with bun
2. Runs `node scripts/build-aws.mjs` → `.output/public/` + `.output/lambda.zip`
3. Syncs assets to S3 (long cache for hashed files, no-cache for HTML)
4. Updates the Lambda code & waits for it to settle
5. Invalidates CloudFront `/*`

## Cost (low traffic)

| Component | $/mo |
|---|---|
| S3 + requests | ~0.10 |
| Lambda (free tier 1M req + 400k GB-s) | 0 |
| CloudFront (free tier 1 TB first year) | 0 → ~2 |
| Route 53 hosted zone (optional) | 0.50 |
| **Total** | **~$0–3** |

## Troubleshooting

- **502 from CloudFront** → Lambda crashed. Check CloudWatch Logs `/aws/lambda/<FN_NAME>`.
- **`Could not locate fetch handler`** → the TanStack node-server build did not export a fetch handler at the path the shim expects. Inspect `.output/server/index.mjs` and adjust `getAppHandler()` in `scripts/lambda-handler.mjs`.
- **Static assets 403** → OAC not attached to the S3 bucket policy, or CloudFront behavior order is wrong.
- **Cold starts feel slow** → raise Lambda memory to 1024 MB, or add provisioned concurrency = 1 (~$5/mo for 512 MB).

## What this does NOT change

- `vite.config.ts` (Cloudflare Workers — Lovable preview/publish)
- `wrangler.jsonc`
- Any `src/**` application code
- Lovable Cloud / Supabase database
