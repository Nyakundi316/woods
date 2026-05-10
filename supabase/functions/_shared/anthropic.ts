import Anthropic from 'npm:@anthropic-ai/sdk';

// Instantiated once per Edge Function invocation.
// API key is read from Supabase secrets — never from the mobile bundle.
export const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});

export const SONNET = 'claude-sonnet-4-6';
export const HAIKU = 'claude-haiku-4-5-20251001';
