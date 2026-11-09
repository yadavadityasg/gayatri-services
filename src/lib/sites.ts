function readPublicEnv(name: string, fallback: string) {
  const viteValue = (import.meta.env as Record<string, string | undefined>)[name];
  if (viteValue) return viteValue.replace(/\/$/, "");
  const env = typeof process !== "undefined" ? process.env : undefined;
  const runtime = env?.[name];
  return (runtime || fallback).replace(/\/$/, "");
}

/** Customer site. The admin container links here instead of its own origin. */
export const publicSiteUrl = readPublicEnv("VITE_PUBLIC_APP_URL", "http://localhost:3000");

/** Admin portal. Separate origin from the customer site. */
export const adminSiteUrl = readPublicEnv("VITE_ADMIN_APP_URL", "http://localhost:3001");
