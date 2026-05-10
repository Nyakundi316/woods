// Phase 4: Scheduled drop ingestion (pg_cron, daily).
// Scrapes public release calendars, sets pending_review = true.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (_req) => {
  return new Response(
    JSON.stringify({ error: 'Not implemented — Phase 4' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
