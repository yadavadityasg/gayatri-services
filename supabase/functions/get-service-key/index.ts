// TEMPORARY — delete immediately after copying the key into Lambda env vars.
// Returns the SUPABASE_SERVICE_ROLE_KEY so it can be pasted into AWS Lambda.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "(not set)";
  const url = Deno.env.get("SUPABASE_URL") ?? "(not set)";

  return new Response(
    JSON.stringify(
      {
        warning: "DELETE THIS FUNCTION IMMEDIATELY AFTER COPYING THE KEY",
        SUPABASE_URL: url,
        SUPABASE_SERVICE_ROLE_KEY: key,
      },
      null,
      2,
    ),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
