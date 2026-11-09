/** Read catalog rows from the Postgres-backed API on this app container. */
export async function catalogGet<T>(path: string): Promise<T | null> {
  const origin =
    typeof window === "undefined" ? `http://127.0.0.1:${process.env.PORT || 3000}` : "";
  try {
    const response = await fetch(`${origin}/api/catalog${path}`);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error("[catalog]", path, error instanceof Error ? error.message : error);
    return null;
  }
}
