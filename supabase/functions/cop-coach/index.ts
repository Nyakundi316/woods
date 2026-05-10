// Cop Coach — streaming conversational agent (Claude Sonnet).
// Context: user style DNA + drop info + match score + sample closet injected into system prompt.
// Client sends full message history; edge function streams SSE back.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { anthropic, SONNET } from '../_shared/anthropic.ts';
import { COP_COACH_SYSTEM_PROMPT } from '../_shared/prompts.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

type ChatMessage = { role: 'user' | 'assistant'; content: string };

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

  const body = await req.json() as { dropId: string; messages: ChatMessage[] };
  const { dropId, messages } = body;

  if (!dropId || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'dropId and messages required' }, { status: 400 });
  }

  // Fetch all context in parallel
  const [styleRes, dropRes, scoreRes, closetRes] = await Promise.all([
    supabase
      .from('style_profiles')
      .select('tags, summary_text, dominant_aesthetic, confidence')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('drops')
      .select('name, colorway, retail_price_usd, description, release_date, brands(name)')
      .eq('id', dropId)
      .single(),
    supabase
      .from('drop_match_scores')
      .select('score, reasoning')
      .eq('user_id', user.id)
      .eq('drop_id', dropId)
      .maybeSingle(),
    supabase
      .from('closet_items')
      .select('brand, model, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (dropRes.error) {
    return Response.json({ error: 'Drop not found' }, { status: 404 });
  }

  const drop = dropRes.data as {
    name: string; colorway: string; retail_price_usd: number | null;
    description: string; release_date: string; brands: { name: string } | null;
  };
  const style = styleRes.data as {
    tags: string[]; summary_text: string; dominant_aesthetic: string; confidence: number;
  } | null;
  const score = scoreRes.data as { score: number; reasoning: string | null } | null;
  const closet = (closetRes.data ?? []) as { brand: string; model: string; category: string }[];

  const closetList = closet.length > 0
    ? closet.map((c) => `  - ${c.brand} ${c.model} (${c.category})`).join('\n')
    : '  (no closet items yet)';

  const contextBlock = `
---
USER CONTEXT:
Style DNA tags: ${style?.tags?.join(', ') ?? 'not captured'}
Dominant aesthetic: ${style?.dominant_aesthetic ?? 'unknown'}
Style summary: ${style?.summary_text ?? 'not available'}

DROP BEING DISCUSSED:
Brand: ${drop.brands?.name ?? 'unknown'}
Name: ${drop.name}
Colorway: ${drop.colorway}
Retail: ${drop.retail_price_usd !== null ? `$${drop.retail_price_usd}` : 'TBA'}
Release: ${drop.release_date}
Description: ${drop.description}
Match score: ${score ? `${Math.round(score.score * 100)}%` : 'not scored'}
Score reasoning: ${score?.reasoning ?? 'not available'}

CLOSET SAMPLE (last 10 items):
${closetList}

Resale data: not available in current build
---`;

  const systemPrompt = COP_COACH_SYSTEM_PROMPT + contextBlock;

  const stream = anthropic.messages.stream({
    model: SONNET,
    max_tokens: 600,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (e) {
        const errData = JSON.stringify({ error: (e as Error).message });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
});
