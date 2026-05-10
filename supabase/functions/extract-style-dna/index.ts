import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { openai, GPT4O, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '../_shared/openai.ts';
import { STYLE_DNA_EXTRACTION_PROMPT } from '../_shared/prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PhotoTags = {
  silhouettes: string[];
  palette: string[];
  eras: string[];
  formality: string;
  brands_visible: string[];
  dominant_aesthetic: string;
};

function scoreConfidence(photoCount: number): number {
  return Math.min(1.0, photoCount / 10);
}

function synthesiseTagsToText(allTags: PhotoTags[]): string {
  const silhouettes = [...new Set(allTags.flatMap((t) => t.silhouettes))];
  const palette = [...new Set(allTags.flatMap((t) => t.palette))];
  const eras = [...new Set(allTags.flatMap((t) => t.eras))];
  const brands = [...new Set(allTags.flatMap((t) => t.brands_visible))];
  const aesthetics = allTags.map((t) => t.dominant_aesthetic).filter(Boolean);
  const formalities = allTags.map((t) => t.formality).filter(Boolean);

  return [
    silhouettes.length ? `Silhouettes: ${silhouettes.join(', ')}.` : '',
    palette.length ? `Palette: ${palette.join(', ')}.` : '',
    eras.length ? `Eras: ${eras.join(', ')}.` : '',
    formalities.length ? `Formality: ${[...new Set(formalities)].join(', ')}.` : '',
    brands.length ? `Brands: ${brands.join(', ')}.` : '',
    aesthetics.length ? `Aesthetics: ${aesthetics.join('. ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function aggregateTags(allTags: PhotoTags[]): PhotoTags {
  const freq = <T,>(arr: T[]): T | undefined => {
    const counts = new Map<string, number>();
    for (const item of arr) counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0] ? (sorted[0][0] as unknown as T) : undefined;
  };

  return {
    silhouettes: [...new Set(allTags.flatMap((t) => t.silhouettes))].slice(0, 6),
    palette: [...new Set(allTags.flatMap((t) => t.palette))].slice(0, 8),
    eras: [...new Set(allTags.flatMap((t) => t.eras))].slice(0, 4),
    formality: (freq(allTags.map((t) => t.formality)) ?? 'streetwear') as PhotoTags['formality'],
    brands_visible: [...new Set(allTags.flatMap((t) => t.brands_visible))].slice(0, 8),
    dominant_aesthetic: freq(allTags.map((t) => t.dominant_aesthetic)) ?? allTags[0]?.dominant_aesthetic ?? '',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate via JWT
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
    }

    const { photo_paths } = await req.json() as { photo_paths: string[] };
    if (!Array.isArray(photo_paths) || photo_paths.length === 0) {
      return new Response(JSON.stringify({ error: 'photo_paths is required' }), { status: 400, headers: corsHeaders });
    }

    // Process each photo: download from Storage → base64 → GPT-4o vision
    const allTags: PhotoTags[] = [];

    for (const path of photo_paths) {
      try {
        const { data: blob, error: dlErr } = await supabaseAdmin.storage
          .from('style-dna')
          .download(path);
        if (dlErr || !blob) continue;

        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = path.endsWith('.png') ? 'image/png' : 'image/jpeg';

        const vision = await openai.chat.completions.create({
          model: GPT4O,
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: STYLE_DNA_EXTRACTION_PROMPT },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'low' } },
              ],
            },
          ],
        });

        const raw = vision.choices[0]?.message?.content?.trim() ?? '';
        // Strip markdown fences if model wraps the JSON
        const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        const tags = JSON.parse(jsonStr) as PhotoTags;
        allTags.push(tags);
      } catch {
        // Skip photos that fail vision analysis; proceed with the rest
        continue;
      }
    }

    if (allTags.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Could not analyse any photos — check image quality' }),
        { status: 422, headers: corsHeaders },
      );
    }

    // Aggregate tags across all photos
    const aggregated = aggregateTags(allTags);
    const synthesisText = synthesiseTagsToText(allTags);
    const confidence = scoreConfidence(allTags.length);

    // Generate style embedding
    const embeddingRes = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: synthesisText,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    const embedding = embeddingRes.data[0].embedding;

    // Upsert into style_profiles
    const { error: upsertErr } = await supabaseAdmin.from('style_profiles').upsert({
      user_id: user.id,
      embedding,
      tags: aggregated,
      source_photo_count: allTags.length,
      confidence_score: confidence,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (upsertErr) {
      return new Response(
        JSON.stringify({ error: `Database error: ${upsertErr.message}` }),
        { status: 500, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        tags: aggregated,
        confidence_score: confidence,
        source_photo_count: allTags.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
