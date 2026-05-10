// Phase 5: Cop Coach conversational agent (Claude Sonnet).
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (_req) => {
  return new Response(
    JSON.stringify({ error: 'Not implemented — Phase 5' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
