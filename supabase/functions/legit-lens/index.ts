// Legit Lens — multi-image GPT-4o authentication scan.
// Client uploads up to 6 photos to auth-scans bucket, then POSTs their storage paths here.
// Edge function downloads each photo, sends all to GPT-4o in one call, saves to auth_scans.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { openai, GPT4O } from '../_shared/openai.ts';
import { LEGIT_LENS_PROMPT } from '../_shared/prompts.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

type Flag = { area: string; concern: string; severity: 'low' | 'medium' | 'high' };
type ScanResult = {
  brand_guess: string;
  model_guess: string;
  confidence: number;
  flags: Flag[];
  verdict: 'likely_authentic' | 'inconclusive' | 'likely_replica';
};

async function pathToBase64(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('auth-scans')
    .download(storagePath);
  if (error) throw new Error(`Failed to download ${storagePath}: ${error.message}`);
  const buffer = await data.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json() as { storage_paths: string[] };
  const { storage_paths } = body;

  if (!Array.isArray(storage_paths) || storage_paths.length < 1 || storage_paths.length > 6) {
    return Response.json({ error: '1–6 storage_paths required' }, { status: 400 });
  }

  // Download all photos in parallel and convert to base64
  const base64Images = await Promise.all(storage_paths.map(pathToBase64));

  // Build the multi-image message content
  const imageContent = base64Images.map((b64) => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'high' as const },
  }));

  const res = await openai.chat.completions.create({
    model: GPT4O,
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: LEGIT_LENS_PROMPT },
        ],
      },
    ],
  });

  const raw = res.choices[0].message.content ?? '';
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1] : raw;

  let result: ScanResult;
  try {
    result = JSON.parse(jsonText) as ScanResult;
  } catch {
    return Response.json({ error: 'Failed to parse scan result', raw }, { status: 500 });
  }

  // Clamp confidence per prompt rules
  const confidence = Math.min(result.confidence ?? 0, 0.95);

  // Persist to auth_scans
  const { data: scan, error: insertErr } = await (supabase as any)
    .from('auth_scans')
    .insert({
      user_id: user.id,
      photos: storage_paths,
      brand_guess: result.brand_guess ?? null,
      model_guess: result.model_guess ?? null,
      confidence,
      flags: result.flags ?? [],
      verdict: result.verdict,
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  return Response.json({ ...scan, confidence });
});
