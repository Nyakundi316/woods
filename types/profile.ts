export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  country_code: string;
  shoe_size_us: number | null;
  shoe_size_eu: number | null;
  preferred_currency: string;
  onboarding_completed: boolean;
  created_at: string;
};

export type CountryOption = {
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
};

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: 'KE', name: 'Kenya', currency: 'KES', phonePrefix: '+254' },
  { code: 'US', name: 'United States', currency: 'USD', phonePrefix: '+1' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', phonePrefix: '+44' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', phonePrefix: '+234' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', phonePrefix: '+27' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', phonePrefix: '+233' },
];
