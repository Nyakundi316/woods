export type ClosetCategory = 'sneaker' | 'apparel' | 'accessory';

export type ClosetItem = {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  colorway: string | null;
  category: ClosetCategory;
  photo_url: string;
  embedding: number[] | null;
  acquired_at: string | null;
  created_at: string;
};

export type ClosetItemInsert = {
  user_id: string;
  brand: string;
  model: string;
  colorway: string | null;
  category: ClosetCategory;
  photo_url: string;
  embedding?: number[] | null;
  acquired_at?: string | null;
};

export const CATEGORY_LABELS: Record<ClosetCategory, string> = {
  sneaker: 'Sneaker',
  apparel: 'Apparel',
  accessory: 'Accessory',
};
