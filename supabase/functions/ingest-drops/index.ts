// Scheduled daily drop ingestion from Sneaker News release calendar.
// SWAP: replace scraper with SoleRetriever API when licensed (endpoint: api.soleretriever.com/v1/releases).
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface ScrapeResult {
  name: string;
  colorway: string;
  sku: string | null;
  retail_price_usd: number | null;
  release_date: string;
  photo_url: string;
  buy_url: string;
  description: string;
  brand_slug: string;
}

async function scrapeSneakerNews(): Promise<ScrapeResult[]> {
  // Fetch the Sneaker News upcoming releases page
  const res = await fetch('https://sneakernews.com/upcoming-sneaker-releases/', {
    headers: { 'User-Agent': 'Woods/1.0 (drop discovery; not for commercial scraping)' },
  });
  if (!res.ok) throw new Error(`Sneaker News fetch failed: ${res.status}`);

  const html = await res.text();

  // Parse product cards from the HTML — Sneaker News uses article cards with schema.org markup
  const results: ScrapeResult[] = [];

  // Extract structured data from JSON-LD blocks
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Product' && data.name) {
        const releaseDate = data.offers?.availabilityStarts?.split('T')[0];
        if (!releaseDate) continue;

        const brandSlug = (data.brand?.name ?? 'unknown').toLowerCase().replace(/\s+/g, '-');
        results.push({
          name: data.name,
          colorway: data.color ?? '',
          sku: data.sku ?? null,
          retail_price_usd: data.offers?.price ? Number(data.offers.price) : null,
          release_date: releaseDate,
          photo_url: data.image ?? '',
          buy_url: data.url ?? data.offers?.url ?? '',
          description: data.description ?? data.name,
          brand_slug: brandSlug,
        });
      }
    } catch {
      // Malformed JSON-LD — skip
    }
  }

  return results;
}

Deno.serve(async (req) => {
  // Allow cron invocations (service role auth) and manual POST
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const isServiceRole = authHeader === `Bearer ${serviceKey}`;

  if (!isServiceRole) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const scraped = await scrapeSneakerNews();

    if (scraped.length === 0) {
      return Response.json({ ingested: 0, message: 'No new drops found' });
    }

    // Resolve brand_ids by slug
    const slugs = [...new Set(scraped.map((d) => d.brand_slug))];
    const { data: brands } = await supabase
      .from('brands')
      .select('id, slug')
      .in('slug', slugs);

    const brandMap = new Map((brands ?? []).map((b: { id: string; slug: string }) => [b.slug, b.id]));

    // Build drop rows — set pending_review = true (human review before going live)
    const rows = scraped
      .filter((d) => brandMap.has(d.brand_slug))
      .map((d) => ({
        brand_id: brandMap.get(d.brand_slug)!,
        name: d.name,
        colorway: d.colorway,
        sku: d.sku,
        retail_price_usd: d.retail_price_usd,
        release_date: d.release_date,
        photo_url: d.photo_url,
        buy_url: d.buy_url,
        description: d.description,
        pending_review: true,
      }));

    if (rows.length === 0) {
      return Response.json({ ingested: 0, message: 'No drops matched known brands' });
    }

    // Upsert on (brand_id, name, release_date) to avoid duplicates
    const { error } = await supabase
      .from('drops')
      .upsert(rows, { onConflict: 'brand_id,name,release_date', ignoreDuplicates: true });

    if (error) throw error;

    return Response.json({ ingested: rows.length });
  } catch (e: unknown) {
    console.error('ingest-drops error', e);
    return Response.json(
      { error: (e as { message?: string }).message ?? 'Unknown error' },
      { status: 500 },
    );
  }
});
