
The user is asking for a research/advisory answer (hosting roadmap), not a code change. No plan tag needed for pure Q&A — but since they asked for a "roadmap" I'll structure it clearly. Key facts about this app:

- TanStack Start v1 (SSR React) targeting Cloudflare Workers via wrangler
- Uses Lovable Cloud (Supabase) for DB + auth
- Static assets + SSR server entry
- Low traffic expected (small business site)

Cheapest AWS = avoid EC2/ECS/RDS. Use serverless + managed free tiers.

# AWS Hosting Roadmap — Lowest Cost

## Architecture overview

```text
 Users
   │
   ▼
CloudFront (CDN, free tier 1TB/mo first year, then ~$0.085/GB)
   │
   ├──► S3 bucket          → static assets (JS/CSS/images)
   │
   └──► Lambda@Edge or     → SSR (TanStack Start server entry)
        Lambda + API GW
                │
                ▼
        Supabase (keep as-is, free tier) OR migrate to:
        - Supabase self-hosted on Lightsail ($5/mo), or
        - AWS RDS Aurora Serverless v2 (min 0.5 ACU ≈ $43/mo) — NOT cheap
        - Neon/Supabase cloud free tier — recommended
```

## Phase 1 — Prep the app (1–2 hrs)

1. Switch the build target from Cloudflare Workers to **Node** so it runs on Lambda. Edit `vite.config.ts` to remove the Cloudflare preset (or use the AWS Lambda adapter for TanStack Start).
2. Verify SSR build outputs: `.output/server/` (handler) + `.output/public/` (static).
3. Keep Lovable Cloud / Supabase for DB + auth — moving the DB off is where costs explode.

## Phase 2 — Cheapest path: S3 + CloudFront + Lambda Function URL (recommended)

| Component | Purpose | Monthly cost (low traffic) |
|---|---|---|
| S3 bucket | Static assets | ~$0.10 |
| CloudFront | CDN + HTTPS | Free tier 1 TB/mo first year, then ~$1–3 |
| Lambda (Function URL) | SSR handler | Free tier 1M requests + 400k GB-s/mo, then ~$0 for small site |
| Route 53 hosted zone | DNS (optional, $0.50/mo) | $0.50 |
| ACM cert | TLS | Free |
| **Total** | | **~$0–2/mo first year, ~$2–5/mo after** |

Steps:
1. Create S3 bucket → upload `.output/public/` (private, OAC-only access).
2. Create Lambda function (Node 20), deploy `.output/server/` handler. Enable Function URL.
3. Create CloudFront distribution:
   - Default origin → Lambda Function URL (SSR routes)
   - `/assets/*` and `/_build/*` origin → S3 (cache forever)
4. Attach ACM cert + custom domain via Route 53 (or Cloudflare DNS for free).
5. Set up GitHub Actions for CI/CD (free): build → upload to S3 → update Lambda.

## Phase 3 — Even cheaper alternative: Lightsail ($3.50–5/mo flat)

If you want **predictable flat pricing** and don't care about scale:

- AWS Lightsail instance $3.50/mo (512 MB RAM, 20 GB SSD, 1 TB transfer)
- Run `node .output/server/index.mjs` behind nginx
- Cloudflare in front (free) for HTTPS + CDN + DDoS
- **Total: $3.50/mo, all-in**

Trade-off: single VM, you patch the OS, no auto-scale. Fine for a repair-shop site.

## Phase 4 — Database options (ranked by cost)

1. **Keep Lovable Cloud / Supabase free tier** → $0/mo, zero migration work. *Recommended.*
2. **Supabase self-hosted on the same Lightsail box** → $0 extra, more ops.
3. **Neon Postgres free tier** → $0, drop-in Postgres replacement.
4. **AWS RDS / Aurora Serverless** → $40+/mo minimum. Avoid for this use case.

## Phase 5 — Things to NOT do (cost traps)

- Don't use **Amplify Hosting** for SSR — pricing creeps fast (~$15+/mo at low traffic).
- Don't use **ECS Fargate** — minimum ~$10/mo per task, and you need 2 for HA.
- Don't use **RDS** unless required — fixed monthly cost dwarfs everything.
- Don't enable **NAT Gateway** ($32/mo) — keep Lambda outside VPC.

## Cost summary

| Setup | Monthly cost | Best for |
|---|---|---|
| S3 + CloudFront + Lambda + Supabase free | **$0–5** | Lowest, scales to zero |
| Lightsail $3.50 + Cloudflare + Supabase free | **$3.50** | Predictable flat fee |
| Amplify Hosting + RDS | $50+ | Avoid |

## Recommendation

Go with **Phase 2** (S3 + CloudFront + Lambda) and **keep Supabase as the DB**. You'll pay essentially $0 for the first year (AWS free tier) and $2–5/mo after, with the app auto-scaling to zero when idle. The only real work is swapping the Vite build target from Cloudflare Workers to a Node/Lambda adapter and wiring up CloudFront.

Want me to switch the build target to a Lambda-compatible adapter and add a deploy script next?
