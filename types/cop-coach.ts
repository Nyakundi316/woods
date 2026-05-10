import type { ClosetItem } from '@/types/closet';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type OutfitPairing = {
  name: string;
  items: string[];
  occasion: string;
  palette_logic: string;
  itemDetails: (ClosetItem | undefined)[];
};
