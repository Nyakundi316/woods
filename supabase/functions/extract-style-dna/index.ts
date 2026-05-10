// Phase 2: Extract Style DNA from user-uploaded photos.
// Calls OpenAI vision per photo, synthesises tags, embeds with text-embedding-3-large.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (_req) => {
  return new Response(
    JSON.stringify({ error: 'Not implemented — Phase 2' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
