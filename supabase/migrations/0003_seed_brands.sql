-- Seed: 9 brands with deterministic UUIDs
INSERT INTO brands (id, name, slug, country_of_origin)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Nike',          'nike',          'US'),
  ('00000000-0000-0000-0000-000000000002', 'Adidas',        'adidas',        'DE'),
  ('00000000-0000-0000-0000-000000000003', 'New Balance',   'new-balance',   'US'),
  ('00000000-0000-0000-0000-000000000004', 'Jordan Brand',  'jordan-brand',  'US'),
  ('00000000-0000-0000-0000-000000000005', 'ASICS',         'asics',         'JP'),
  ('00000000-0000-0000-0000-000000000006', 'Saucony',       'saucony',       'US'),
  ('00000000-0000-0000-0000-000000000007', 'Salomon',       'salomon',       'FR'),
  ('00000000-0000-0000-0000-000000000008', 'Converse',      'converse',      'US'),
  ('00000000-0000-0000-0000-000000000009', 'Vans',          'vans',          'US')
ON CONFLICT (id) DO NOTHING;
