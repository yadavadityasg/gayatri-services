
## Diagnosis

The 400 error from `/auth/v1/token?grant_type=password` with `error_code: invalid_credentials` means Supabase rejected the login because no user exists with those credentials. This is not a code bug — it's a "user doesn't exist / wrong password" response.

Looking at `src/routes/admin.tsx` (which I haven't viewed but based on prior context), the admin page likely only shows the **Login** tab, not Sign up. So you have no way to create the admin account from `/admin` — and `/login` creates regular users, not admins (the trigger only grants admin to `yadavaditya.sg@gmail.com` regardless of which page they sign up on, but you may not have signed up at all yet).

## Plan

**Step 1 — Verify** (you do this, no code change):
Open `/login`, switch to **Sign up** tab, register with `yadavaditya.sg@gmail.com` + a password you'll remember. The DB trigger `handle_new_user_role` auto-grants admin role. Then go to `/admin` and log in with the same credentials.

**If that works → done, no code changes needed.**

**Step 2 — If `/admin` has no Sign up tab, add one** (code change):
Update `src/routes/admin.tsx` to include a Sign up tab on the admin login screen, identical structure to `/login`, so the admin account can be created directly from `/admin`. After signup, the trigger grants admin role and the dashboard becomes accessible.

**Step 3 — Better error messaging** (small polish):
On invalid credentials, show a clearer toast: "No admin account found with that email. Sign up first or check your password."

## What I need to confirm before editing

I need to view `src/routes/admin.tsx` to see whether it already has a Sign up tab. If yes, the fix is just clearer messaging + a hint. If no, I'll add the Sign up tab.

## Recommended action for you right now

Try this first — no code change needed:
1. Go to `/login` (not `/admin`)
2. Click **Sign up** tab
3. Use email `yadavaditya.sg@gmail.com` + any password (min 6 chars)
4. Then go to `/admin` and log in with those same credentials

If that works, you're done. If `/admin` still rejects you after a successful signup, reply and I'll switch to default mode to add a Sign up tab to `/admin` and improve the error message.
