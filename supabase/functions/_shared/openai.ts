import OpenAI from 'npm:openai';

// API key is read from Supabase secrets — never from the mobile bundle.
export const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
});

export const GPT4O = 'gpt-4o';
export const EMBEDDING_MODEL = 'text-embedding-3-large';
export const EMBEDDING_DIMENSIONS = 3072;
