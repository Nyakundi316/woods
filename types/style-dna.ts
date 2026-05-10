export type StyleDNATags = {
  silhouettes: string[];
  palette: string[];
  eras: string[];
  formality: 'loungewear' | 'streetwear' | 'smart casual' | 'tailored';
  brands_visible: string[];
  dominant_aesthetic: string;
};

export type StyleProfile = {
  user_id: string;
  tags: StyleDNATags;
  source_photo_count: number;
  confidence_score: number; // 0..1
  generated_at: string;
};

export type ExtractStyleDNAResponse = {
  tags: StyleDNATags;
  confidence_score: number;
  source_photo_count: number;
};

// Confidence tiers used in UI messaging
export function confidenceTier(score: number): 'low' | 'medium' | 'high' {
  if (score < 0.5) return 'low';
  if (score < 0.8) return 'medium';
  return 'high';
}
