export type ScanVerdict = 'likely_authentic' | 'inconclusive' | 'likely_replica';
export type FlagSeverity = 'low' | 'medium' | 'high';

export type ScanFlag = {
  area: string;
  concern: string;
  severity: FlagSeverity;
};

export type AuthScan = {
  id: string;
  user_id: string;
  photos: string[];
  brand_guess: string | null;
  model_guess: string | null;
  confidence: number;
  flags: ScanFlag[];
  verdict: ScanVerdict;
  created_at: string;
};

export const PHOTO_SLOTS: { label: string; hint: string }[] = [
  { label: 'Tongue / Label', hint: 'Lay the tongue flat' },
  { label: 'Heel', hint: 'Back of the shoe' },
  { label: 'Side Profile', hint: 'Lateral side' },
  { label: 'Sole Tread', hint: 'Underside of the shoe' },
  { label: 'Stitching', hint: 'Close-up of toe box stitching' },
  { label: 'Box Label', hint: 'Side label of the box' },
];

export const VERDICT_LABELS: Record<ScanVerdict, string> = {
  likely_authentic: 'Likely Authentic',
  inconclusive: 'Inconclusive',
  likely_replica: 'Likely Replica',
};
