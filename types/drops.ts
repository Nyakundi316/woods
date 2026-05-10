export type Drop = {
  id: string;
  brand_id: string;
  name: string;
  colorway: string;
  sku: string | null;
  retail_price_usd: number | null;
  release_date: string;
  photo_url: string;
  buy_url: string;
  description: string;
  pending_review: boolean;
  created_at: string;
  brands?: { name: string; slug: string };
};

export type DropMatchScore = {
  id: string;
  user_id: string;
  drop_id: string;
  score: number;
  reasoning: string | null;
  created_at: string;
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  drop_id: string;
  created_at: string;
};

export type DropWithScore = Drop & {
  score: number | null;
  reasoning: string | null;
  isWatched: boolean;
};

export type DropFilter = 'all' | 'sneaker' | 'apparel' | 'accessory' | 'watched';
