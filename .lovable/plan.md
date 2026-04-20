

## Where to get `SUPABASE_SERVICE_ROLE_KEY`

The Lovable Cloud UI doesn't have a "reveal value" button for backend-managed secrets like the service role key. Two reliable ways to get it:

### Option A — Cloud → Secrets page (try first)
1. Sidebar → **Secrets** (you were here earlier)
2. Find `SUPABASE_SERVICE_ROLE_KEY` in the list
3. Click the row / eye icon to reveal the value
4. If no reveal button appears, use Option B

### Option B — Print it from a temporary edge function (guaranteed)
The secret IS available to backend code via `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`. I'll create a one-time edge function that returns it, you copy the value into Lambda, then we delete the function.

Steps once you approve:
1. I create `supabase/functions/get-service-key/index.ts` that returns the key (no auth, temporary)
2. You hit the function URL once, copy the value
3. I delete the function immediately

⚠️ This key bypasses all security rules. Only paste it into your Lambda env vars, never into git or client code.

### Then add to Lambda
Lambda → Configuration → Environment variables → Edit → Add:
- `SUPABASE_URL` = `https://xsoxhdxuicqibstqufdp.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = (anon key from your `.env`)
- `SUPABASE_SERVICE_ROLE_KEY` = (value from Option A or B)

Save → wait ~10s → reload CloudFront URL.

Approve and I'll create the temporary edge function (Option B). Or try Option A first and report back.

