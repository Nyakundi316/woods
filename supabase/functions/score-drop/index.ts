import { createClient } from 'npm:@supabase/supabase-js@2';
import { anthropic, HAIKU } from '../_shared/anthropic.ts';
import { openai, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, GPT4O } from '../_shared/openai.ts';
import { DROP_STYLE_EMBEDDING_PROMPT } from '../_shared/prompts.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateDropEmbedding(drop: {
  name: string;
  colorway: string;
  description: string;
  photo_url: string;
}): Promise<number[]> {
  // Use GPT-4o vision to extract rich style tags, then embed the text
  const visionRes = await openai.chat.completions.create({
    model: GPT4O,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: drop.photo_url, detail: 'low' },
          },
          {
            type: 'text',
            text: `${DROP_STYLE_EMBEDDING_PROMPT}\n\nProduct: ${drop.name} "${drop.colorway}"\nDescription: ${drop.description}`,
          },
        ],
      },
    ],
  });

  const raw = visionRes.choices[0].message.content ?? '';
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : raw;

  const embeddingRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    input: `${drop.name} ${drop.colorway} ${drop.description} ${text}`,
  });

  return embeddingRes.data[0].embedding;
}

async function generateHaikuReasoning(
  drop: { name: string; colorway: string; description: string; retail_price_usd: number },
  score: number,
  styleTags: string[],
): Promise<string> {
  const pct = Math.round(score * 100);
  const msg = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `You matched a sneaker drop for a user. Give a 2-sentence explanation of why this drop scores ${pct}% against their taste profile. Be specific — reference the drop details and their style tags.

Drop: ${drop.name} "${drop.colorway}" — $${drop.retail_price_usd}
Description: ${drop.description}
User style tags: ${styleTags.join(', ')}

Output only the 2 sentences. No prefix, no label.`,
      },
    ],
  });

  return (msg.content[0] as { text: string }).text.trim();
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

  try {
    // 1. Fetch user style profile
    const { data: styleProfile, error: spErr } = await supabase
      .from('style_profiles')
      .select('embedding, tags')
      .eq('user_id', user.id)
      .maybeSingle();

    if (spErr) throw spErr;
    if (!styleProfile?.embedding) {
      return Response.json({ scored: 0, message: 'No style profile yet' });
    }

    const userEmbedding: number[] = styleProfile.embedding;
    const styleTags: string[] = styleProfile.tags ?? [];

    // 2. Fetch all live drops
    const { data: drops, error: dropsErr } = await supabase
      .from('drops')
      .select('id, name, colorway, description, retail_price_usd, photo_url, style_embedding')
      .eq('pending_review', false);

    if (dropsErr) throw dropsErr;
    if (!drops || drops.length === 0) {
      return Response.json({ scored: 0 });
    }

    // 3. Generate missing embeddings lazily
    const embeddingUpdates: Promise<void>[] = [];
    const enrichedDrops = await Promise.all(
      drops.map(async (drop) => {
        if (drop.style_embedding) {
          return { ...drop, embedding: drop.style_embedding as number[] };
        }
        const embedding = await generateDropEmbedding(drop);
        embeddingUpdates.push(
          supabase
            .from('drops')
            .update({ style_embedding: embedding })
            .eq('id', drop.id)
            .then(() => undefined),
        );
        return { ...drop, embedding };
      }),
    );

    // Persist in background
    Promise.all(embeddingUpdates).catch(console.error);

    // 4. Cosine similarity for all drops
    const scored = enrichedDrops
      .map((drop) => ({
        drop_id: drop.id,
        drop,
        similarity: cosineSimilarity(userEmbedding, drop.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // 5. Haiku reasoning for top 10 only
    const top10 = scored.slice(0, 10);
    const withReasoning = await Promise.all(
      top10.map(async ({ drop_id, drop, similarity }) => {
        const reasoning = await generateHaikuReasoning(drop, similarity, styleTags);
        return { drop_id, score: similarity, reasoning };
      }),
    );

    const rest = scored.slice(10).map(({ drop_id, similarity }) => ({
      drop_id,
      score: similarity,
      reasoning: null as string | null,
    }));

    const allScores = [...withReasoning, ...rest];

    // 6. Upsert scores
    const rows = allScores.map(({ drop_id, score, reasoning }) => ({
      user_id: user.id,
      drop_id,
      score,
      reasoning,
    }));

    const { error: upsertErr } = await supabase
      .from('drop_match_scores')
      .upsert(rows, { onConflict: 'user_id,drop_id' });

    if (upsertErr) throw upsertErr;

    return Response.json({ scored: allScores.length });
  } catch (e: unknown) {
    console.error('score-drop error', e);
    return Response.json(
      { error: (e as { message?: string }).message ?? 'Unknown error' },
      { status: 500 },
    );
  }
});
