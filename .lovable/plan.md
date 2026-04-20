

## Fix: scan all server bundle files for runtime imports

**Root cause**: `scripts/build-aws.mjs` only scans `.output/server/server.js` for bare-package imports. But TanStack/Nitro splits SSR code into chunks under `.output/server/assets/*.js`, and those chunks import packages like `sonner`, `lucide-react`, `@radix-ui/*`, etc. Those packages are never copied into the Lambda zip → `ERR_MODULE_NOT_FOUND` at runtime.

**Fix**: walk the entire `.output/server/` directory recursively, scan every `.js`/`.mjs` file for bare imports, dedupe, then run the existing `collectRuntimePackages` + copy logic on the union.

### Change

In `scripts/build-aws.mjs`, replace the single-file scan (lines ~104–140) with a recursive scan:

1. Add a small `walkJsFiles(dir)` helper that yields every `.js`/`.mjs` file under `dir` (skip the `node_modules` subdir we're populating).
2. Build the import set from the union of all those files (same regex, same `getPackageName`).
3. Feed that set into the existing `collectRuntimePackages` → copy → write `package.json` flow (unchanged).
4. Keep the existing debug prints for `server.js` exports (useful diagnostics), just move the package-collection step to operate on the full set.

After this, the Lambda zip will include `sonner` and any other packages referenced by split SSR chunks (along with their transitive deps, which `collectRuntimePackages` already handles).

### After deploy

Push to GitHub → workflow rebuilds → Lambda updates. Then reload the CloudFront URL. If a new missing-package error appears it would mean a package is loaded by a path the regex missed (e.g. dynamic `import(variable)`), but for static `from "sonner"`-style imports this fix is complete.

Also reminder: once the site loads, **delete `supabase/functions/get-service-key/`** — it currently exposes the service role key publicly.

