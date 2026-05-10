import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { openai, GPT4O, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '../_shared/openai.ts';
import { CLOSET_CATALOGING_PROMPT } from '../_shared/prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CatalogResult = {
  brand: string;
  model: string;
  colorway: string;
  category: 'sneaker' | 'apparel' | 'accessory';
  embedding: number[];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const { storage_path } = await req.json() as { storage_path: string };
    if (!storage_path) {
      return new Response(JSON.stringify({ error: 'storage_path is required' }), { status: 400, headers: corsHeaders });
    }

    // Download photo from private closet bucket using service role
    const { data: blob, error: dlErr } = await supabaseAdmin.storage
      .from('closet')
      .download(storage_path);
    if (dlErr || !blob) {
      return new Response(JSON.stringify({ error: 'Could not retrieve photo' }), { status: 404, headers: corsHeaders });
    }

    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = storage_path.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // GPT-4o vision: identify the item
    const vision = await openai.chat.completions.create({
      model: GPT4O,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: CLOSET_CATALOGING_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
          ],
        },
      ],
    });

    const raw = vision.choices[0]?.message?.content?.trim() ?? '';
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const detected = JSON.parse(jsonStr) as Omit<CatalogResult, 'embedding'>;

    // Generate embedding for outfit pairing (Phase 5)
    const embeddingText = `${detected.category}: ${detected.brand} ${detected.model} in ${detected.colorway}`;
    const embeddingRes = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: embeddingText,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    const embedding = embeddingRes.data[0].embedding;

    const result: CatalogResult = { ...detected, embedding };
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
