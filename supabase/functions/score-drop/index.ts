// Phase 4: Compute cosine similarity match score for a user/drop pair.
// Uses pgvector <=> operator in Postgres, then Claude Haiku for reasoning text.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (_req) => {
  return new Response(
    JSON.stringify({ error: 'Not implemented — Phase 4' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
