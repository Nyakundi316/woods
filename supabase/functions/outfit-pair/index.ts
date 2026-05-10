// Outfit pairing — given a drop + user closet, suggests 3–5 outfit combos (Claude Sonnet).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { anthropic, SONNET } from '../_shared/anthropic.ts';
import { OUTFIT_PAIRING_PROMPT } from '../_shared/prompts.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

type ClosetItem = { id: string; brand: string; model: string; colorway: string | null; category: string };
type OutfitPairing = { name: string; items: string[]; occasion: string; palette_logic: string };

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

  const body = await req.json() as { dropId: string };
  const { dropId } = body;
  if (!dropId) {
    return Response.json({ error: 'dropId required' }, { status: 400 });
  }

  const [dropRes, closetRes] = await Promise.all([
    supabase
      .from('drops')
      .select('name, colorway, description, brands(name)')
      .eq('id', dropId)
      .single(),
    supabase
      .from('closet_items')
      .select('id, brand, model, colorway, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  if (dropRes.error) {
    return Response.json({ error: 'Drop not found' }, { status: 404 });
  }

  const drop = dropRes.data as { name: string; colorway: string; description: string; brands: { name: string } | null };
  const closet = (closetRes.data ?? []) as ClosetItem[];

  if (closet.length === 0) {
    return Response.json({ pairings: [], message: 'Add items to your closet first' });
  }

  const closetJson = JSON.stringify(
    closet.map((c) => ({ id: c.id, label: `${c.brand} ${c.model}${c.colorway ? ` (${c.colorway})` : ''}`, category: c.category })),
    null,
    2,
  );

  const msg = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `${OUTFIT_PAIRING_PROMPT}

Target sneaker: ${drop.brands?.name ?? ''} ${drop.name} "${drop.colorway}"
Description: ${drop.description}

User closet:
${closetJson}`,
      },
    ],
  });

  const raw = (msg.content[0] as { text: string }).text;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1] : raw;

  let pairings: OutfitPairing[] = [];
  try {
    pairings = JSON.parse(jsonText) as OutfitPairing[];
  } catch {
    return Response.json({ error: 'Failed to parse outfit pairings', raw }, { status: 500 });
  }

  // Enrich: attach closet item details for each pairing
  const closetMap = new Map(closet.map((c) => [c.id, c]));
  const enriched = pairings.map((p) => ({
    ...p,
    itemDetails: p.items.map((id) => closetMap.get(id)).filter(Boolean),
  }));

  return Response.json({ pairings: enriched });
});
