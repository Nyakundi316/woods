-- Seed: 36 drops across 9 brands, release dates May–August 2026
-- photo_url placeholders use sneakernews CDN-style paths
-- style_embedding is NULL here; score-drop generates it on first match request
-- pending_review = false so they appear immediately in the feed

INSERT INTO drops (
  id, brand_id, name, colorway, sku, retail_price_usd,
  release_date, photo_url, buy_url, description, pending_review
)
VALUES

-- ── Nike (4) ──────────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
 'Air Max 1 "Safari"', 'Brown/Kumquat-Sail', 'DZ4549-200', 140,
 '2026-05-10', 'https://images.sneakernews.com/wp-content/uploads/2026/airmax1-safari.jpg',
 'https://nike.com/t/air-max-1-safari', 'A heritage reissue of the iconic AM1 Safari with original Brown and Kumquat blocking on a classic off-white midsole.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
 'Air Force 1 Low "NBA 50th"', 'White/Gold-Metallic', 'FZ1270-100', 130,
 '2026-05-24', 'https://images.sneakernews.com/wp-content/uploads/2026/af1-nba50.jpg',
 'https://nike.com/t/air-force-1-low-nba50', 'Marking fifty years of the NBA with metallic gold accents on the classic AF1 silhouette.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
 'Nike Killshot 2 "Natural"', 'Sail/Gum-Light Brown', '432997-121', 75,
 '2026-06-14', 'https://images.sneakernews.com/wp-content/uploads/2026/killshot2-natural.jpg',
 'https://nike.com/t/killshot-2-natural', 'The cult-favourite Killshot 2 returns in a clean all-natural colourway with gum outsole.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
 'Air Max 90 "Infrared" 2026', 'White/Black-University Red', 'CT1685-100', 130,
 '2026-07-04', 'https://images.sneakernews.com/wp-content/uploads/2026/airmax90-infrared-2026.jpg',
 'https://nike.com/t/air-max-90-infrared-2026', 'The iconic Infrared colourway returns on the Air Max 90 for its anniversary run.', false),

-- ── Adidas (4) ────────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000002',
 'Adidas Samba OG "Core Black"', 'Core Black/Cloud White-Gum', 'B75807', 100,
 '2026-05-08', 'https://images.sneakernews.com/wp-content/uploads/2026/samba-og-black.jpg',
 'https://adidas.com/us/samba-og-shoes', 'The original Samba OG in its most essential colourway — no additions, no subtractions.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000002',
 'Adidas Gazelle "Collegiate Green"', 'Collegiate Green/Gold-White', 'IG6201', 100,
 '2026-06-06', 'https://images.sneakernews.com/wp-content/uploads/2026/gazelle-college-green.jpg',
 'https://adidas.com/us/gazelle-shoes', 'Prep-tinged Collegiate Green Gazelle with tonal gold Three Stripes and premium suede upper.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000002',
 'Adidas Campus 00s "Hazy Copper"', 'Hazy Copper/Wonder Clay', 'HQ8708', 90,
 '2026-06-27', 'https://images.sneakernews.com/wp-content/uploads/2026/campus00s-hazy-copper.jpg',
 'https://adidas.com/us/campus-00s-shoes', 'The oversized Campus 00s silhouette in earthy Hazy Copper suede for summer.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000002',
 'Adidas Handball Spezial "Ash Green"', 'Ash Green/Light Brown', 'GY6804', 120,
 '2026-08-01', 'https://images.sneakernews.com/wp-content/uploads/2026/spezial-ash-green.jpg',
 'https://adidas.com/us/handball-spezial-shoes', 'Indoor court heritage meets streetwear in a muted Ash Green Handball Spezial.', false),

-- ── New Balance (4) ───────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003',
 'New Balance 990v6 "Grey"', 'Grey/Silver-White', 'M990GL6', 200,
 '2026-05-17', 'https://images.sneakernews.com/wp-content/uploads/2026/990v6-grey.jpg',
 'https://newbalance.com/pd/990v6', 'The Made-in-USA 990v6 flagship in the definitive grey colourway.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000003',
 'New Balance 1906R "Protection Pack Sea Salt"', 'Sea Salt/Castlerock', 'M1906REA', 150,
 '2026-06-01', 'https://images.sneakernews.com/wp-content/uploads/2026/1906r-sea-salt.jpg',
 'https://newbalance.com/pd/1906r', 'Protection Pack Sea Salt brings tonal calm to the retro-tech 1906R silhouette.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000003',
 'New Balance 2002R "Burgundy"', 'Burgundy/Dark Burgundy', 'M2002RDR', 130,
 '2026-07-12', 'https://images.sneakernews.com/wp-content/uploads/2026/2002r-burgundy.jpg',
 'https://newbalance.com/pd/2002r', 'Deep burgundy monochrome on the ABZORB-cushioned 2002R panel construction.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000003',
 'New Balance 574 "Heritage Pack"', 'Navy/Red-Grey', 'ML574EVN', 80,
 '2026-08-09', 'https://images.sneakernews.com/wp-content/uploads/2026/574-heritage-pack.jpg',
 'https://newbalance.com/pd/574', 'The Heritage Pack 574 revisits the original navy and red blocking in updated suede mesh.', false),

-- ── Jordan Brand (4) ──────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000004',
 'Air Jordan 1 Retro High OG "Royal Reimagined"', 'Black/Varsity Royal', 'DZ5485-042', 180,
 '2026-05-23', 'https://images.sneakernews.com/wp-content/uploads/2026/aj1-royal-reimagined.jpg',
 'https://nike.com/t/air-jordan-1-royal-reimagined', 'A fresh take on the timeless Royal colourway with aged leather and vintage lace detailing.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000004',
 'Air Jordan 3 Retro "White Cement" 2026', 'White/Fire Red-Cement Grey', 'DN3707-100', 200,
 '2026-06-20', 'https://images.sneakernews.com/wp-content/uploads/2026/aj3-white-cement-2026.jpg',
 'https://nike.com/t/air-jordan-3-white-cement-2026', 'The quintessential AJ3 White Cement returns with OG-level construction.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000004',
 'Air Jordan 4 Retro "Bred Reimagined"', 'Black/Fire Red-White', 'FV5029-006', 215,
 '2026-07-18', 'https://images.sneakernews.com/wp-content/uploads/2026/aj4-bred-reimagined.jpg',
 'https://nike.com/t/air-jordan-4-bred-reimagined', 'A modern structural reimagining of the classic Bred colourway on the AJ4 form.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000004',
 'Air Jordan 11 Retro "Jubilee" 2026', 'Black/Metallic Silver', 'CT8012-011', 220,
 '2026-08-15', 'https://images.sneakernews.com/wp-content/uploads/2026/aj11-jubilee-2026.jpg',
 'https://nike.com/t/air-jordan-11-jubilee-2026', 'The patient Jubilee AJ11 celebrates the Jumpman legacy with patent leather and silver chrome.', false),

-- ── ASICS (4) ─────────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005',
 'ASICS Gel-Kayano 14 "Cream/Pure Silver"', 'Cream/Pure Silver', '1201A019-108', 120,
 '2026-05-31', 'https://images.sneakernews.com/wp-content/uploads/2026/kayano14-cream-silver.jpg',
 'https://asics.com/gel-kayano-14', 'The Gel-Kayano 14 in a tonal cream and metallic silver pairing beloved by the style community.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000005',
 'ASICS Gel-Nimbus 9 "Birch/Clay"', 'Birch/Clay Grey-White', '1201A950-200', 130,
 '2026-06-21', 'https://images.sneakernews.com/wp-content/uploads/2026/nimbus9-birch-clay.jpg',
 'https://asics.com/gel-nimbus-9', 'A warm-toned reissue of the chunky Gel-Nimbus 9 with premium mudguard detailing.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000005',
 'ASICS Gel-1090v2 "Nature Bathing"', 'Graphite Grey/Birch', '1201A346-020', 110,
 '2026-07-05', 'https://images.sneakernews.com/wp-content/uploads/2026/gel1090v2-nature.jpg',
 'https://asics.com/gel-1090v2', 'The Gel-1090v2 in the Nature Bathing palette celebrates earth tones and forest hues.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000005',
 'ASICS Gel-Lyte III "Classic Red"', 'Classic Red/White', '1191A331-600', 100,
 '2026-08-22', 'https://images.sneakernews.com/wp-content/uploads/2026/gl3-classic-red.jpg',
 'https://asics.com/gel-lyte-iii', 'The split-tongue Gel-Lyte III returns in bold Classic Red for autumn transition.', false),

-- ── Saucony (4) ───────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006',
 'Saucony Jazz 81 "Cream/Navy"', 'Cream/Navy', 'S70671-2', 90,
 '2026-05-16', 'https://images.sneakernews.com/wp-content/uploads/2026/jazz81-cream-navy.jpg',
 'https://saucony.com/jazz-81', 'The Jazz 81 in a refined cream and navy colourway on clean suede with waffle outsole.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000006',
 'Saucony Shadow 6000 "Incense"', 'Tan/Off-White-Gum', 'S70727-1', 110,
 '2026-06-13', 'https://images.sneakernews.com/wp-content/uploads/2026/shadow6000-incense.jpg',
 'https://saucony.com/shadow-6000', 'The Heritage Shadow 6000 in the Incense colourway — warm tan suede over a natural gum outsole.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000006',
 'Saucony Progrid Omni 9 "Mushroom"', 'Mushroom/Silver', 'S70738-5', 120,
 '2026-07-19', 'https://images.sneakernews.com/wp-content/uploads/2026/omni9-mushroom.jpg',
 'https://saucony.com/progrid-omni-9', 'Y2K-era ProGrid Omni 9 revived in earthy Mushroom and silver for contemporary tastes.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000006',
 'Saucony Courageous "White/Royal"', 'White/Royal Blue', 'S70755-1', 80,
 '2026-08-08', 'https://images.sneakernews.com/wp-content/uploads/2026/courageous-white-royal.jpg',
 'https://saucony.com/courageous', 'The low-profile Courageous makes its return in classic white and royal blue suede.', false),

-- ── Salomon (4) ───────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007',
 'Salomon XT-6 "Olive Night"', 'Olive Night/Vintage Khaki', 'L47293600', 160,
 '2026-05-22', 'https://images.sneakernews.com/wp-content/uploads/2026/xt6-olive-night.jpg',
 'https://salomon.com/xt-6', 'Trail-tech XT-6 in an Olive Night and Vintage Khaki palette built for urban terrain.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000007',
 'Salomon ACS Pro "Ebony/Black"', 'Ebony/Black-Rainy Day', 'L47382200', 190,
 '2026-06-28', 'https://images.sneakernews.com/wp-content/uploads/2026/acspro-ebony.jpg',
 'https://salomon.com/acs-pro', 'The ACS Pro in all-black Ebony — Salomon''s most elevated streetwear silhouette.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000007',
 'Salomon Speedcross 3 "Canyon"', 'Russet Orange/Burnt Ochre', 'L47110800', 130,
 '2026-07-26', 'https://images.sneakernews.com/wp-content/uploads/2026/speedcross3-canyon.jpg',
 'https://salomon.com/speedcross-3', 'The aggressive Speedcross 3 outsole meets desert Canyon colourwork for fall season.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000007',
 'Salomon XT-Slate "Plum Kitten"', 'Plum Kitten/Black-Quiet Shade', 'L47493900', 170,
 '2026-08-29', 'https://images.sneakernews.com/wp-content/uploads/2026/xtslate-plum-kitten.jpg',
 'https://salomon.com/xt-slate', 'The XT-Slate — a slimmer trail silhouette — in an editorial Plum Kitten and dark grey.', false),

-- ── Converse (4) ──────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008',
 'Converse Chuck 70 "Parchment"', 'Parchment/Egret-Black', 'A02765C', 90,
 '2026-05-09', 'https://images.sneakernews.com/wp-content/uploads/2026/chuck70-parchment.jpg',
 'https://converse.com/chuck-70', 'The premium Chuck 70 in off-white Parchment canvas — a wardrobe essential.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000008',
 'Converse Run Star Hike "Phantom Violet"', 'Phantom/True Violet-Black', 'A06170C', 120,
 '2026-06-06', 'https://images.sneakernews.com/wp-content/uploads/2026/rsh-phantom-violet.jpg',
 'https://converse.com/run-star-hike', 'The platform Run Star Hike in bold Phantom and True Violet canvas contrast.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000008',
 'Converse Chuck 70 Hi "Black Mono"', 'Black/Black-Black', 'A08143C', 85,
 '2026-07-11', 'https://images.sneakernews.com/wp-content/uploads/2026/chuck70hi-blackmono.jpg',
 'https://converse.com/chuck-70-hi', 'A complete tonal black Chuck 70 Hi — monochrome canvas with black foxing and sole.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000008',
 'Converse ERX 260 "Terracotta"', 'Terracotta/Warm Beige', 'A06950C', 95,
 '2026-08-16', 'https://images.sneakernews.com/wp-content/uploads/2026/erx260-terracotta.jpg',
 'https://converse.com/erx-260', 'The retro basketball ERX 260 in earthy Terracotta and Warm Beige leather.', false),

-- ── Vans (4) ──────────────────────────────────────────────────────────────────
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009',
 'Vans Sk8-Hi "Checkerboard Black"', 'Black/True White', 'VN0A4BV6YB2', 85,
 '2026-05-03', 'https://images.sneakernews.com/wp-content/uploads/2026/sk8hi-checker-black.jpg',
 'https://vans.com/sk8-hi', 'The Sk8-Hi in the iconic checkerboard canvas with a vulcanised waffle outsole.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000009',
 'Vans Old Skool "Mushroom"', 'Mushroom/True White', 'VN000D3HQ4L', 70,
 '2026-06-20', 'https://images.sneakernews.com/wp-content/uploads/2026/oldskool-mushroom.jpg',
 'https://vans.com/old-skool', 'The Old Skool in warm Mushroom suede and canvas — understated and endlessly wearable.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000009',
 'Vans Slip-On "True White"', 'True White/True White', 'VN000EYEW00', 60,
 '2026-07-25', 'https://images.sneakernews.com/wp-content/uploads/2026/slipon-true-white.jpg',
 'https://vans.com/slip-on', 'The all-white canvas Slip-On — as clean as it gets.', false),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000009',
 'Vans Vault OG Style 73 LX "Sunflower"', 'Sunflower/Marshmallow', 'VN0A4P3XYB2', 110,
 '2026-08-01', 'https://images.sneakernews.com/wp-content/uploads/2026/style73lx-sunflower.jpg',
 'https://vans.com/vault', 'The Vault OG Style 73 in premium Sunflower canvas — a limited-run archive revival.', false)

ON CONFLICT DO NOTHING;
