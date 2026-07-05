-- ============================================================================
-- BrightGrillzz — 05. Seed data (menu, categories, reviews)
-- Idempotent: menu/categories upsert on slug; reviews only seed when empty.
-- ============================================================================

insert into public.menu_categories (name, slug, description, sort_order) values
  ('Signature Grills',      'signature-grills',    'Our signature flame-grilled specialties', 1),
  ('Seafood',               'seafood',             'Fresh ocean catch, grilled to order',     2),
  ('Premium Meats',         'premium-meats',       'Premium cuts grilled to perfection',      3),
  ('Kebabs & Satay',        'kebabs-satay',        'Skewered and grilled over open coals',    4),
  ('Sides & Compliments',   'sides-compliments',   'The perfect partners to your grill',      5),
  ('Beverages',             'beverages',           'Premium drinks, cocktails and wines',     6)
on conflict (slug) do update
  set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.menu_items
  (name, slug, description, price, price_label, rating, category, image, badge, sort_order) values
  ('Royal Platter',        'royal-platter',        'A lavish selection of flame-grilled proteins, sides and dips — built to share.', 18000, '₦18,000 – ₦25,000', 4.9, 'Signature',  '/images/royal-platter.jpg',   'BESTSELLER',     1),
  ('Grilled Tilapia Fish', 'grilled-tilapia-fish', 'Whole fresh fish chargrilled with herbs, lemon butter and house spice.',        15000, '₦15,000 – ₦18,000', 4.8, 'Seafood',    '/images/grilled-fish.jpg',    'CELEBRITY PICK', 2),
  ('Carne Asada',          'carne-asada',          'Flame-grilled marinated beef, sliced and served over an open fire.',            16000, '₦16,000 – ₦20,000', 4.7, 'Meat',       '/images/carne-asada.jpg',     null,             3),
  ('King Crab',            'king-crab',            'Premium ocean-fresh seafood, grilled and finished with garlic butter.',         22000, '₦22,000 – ₦28,000', 5.0, 'Premium',    '/images/king-crab.jpg',       'PREMIUM',        4),
  ('BBQ Ribs',             'bbq-ribs',             'Slow-smoked, fall-off-the-bone ribs glazed in our signature sauce.',            14000, '₦14,000 – ₦17,000', 4.8, 'Barbecue',   '/images/bbq-ribs.jpg',        null,             5),
  ('Skewered Kebab',       'skewered-kebab',       'Tender cuts marinated overnight and grilled over open coals.',                  12000, '₦12,000 – ₦15,000', 4.6, 'Kebab',      '/images/kebab.jpg',           null,             6),
  ('Grilled Porchetta',    'grilled-porchetta',    'Succulent roasted pork belly with crackling and grilled potatoes.',             16000, '₦16,000 – ₦19,000', 4.6, 'Meat',       '/images/porchetta.jpg',       null,             7),
  ('Flame Burger',         'flame-burger',         'Double prime-beef patty, melted cheese and house sauce.',                        8000, '₦8,000 – ₦11,000',  4.5, 'Burger',     '/images/burger.jpg',          null,             8),
  ('Vegetable Skewers',    'vegetable-skewers',    'Garden-fresh vegetables grilled and tossed in herb dressing.',                   6000, '₦6,000 – ₦8,000',   4.4, 'Vegetarian', '/images/veg-skewers.jpg',     null,             9),
  ('Grilled Prawns',       'grilled-prawns',       'Jumbo prawns flame-grilled with garlic, chilli and lime.',                      20000, '₦20,000 – ₦25,000', 4.9, 'Seafood',    '/images/grilled-prawns.jpg',  null,            10),
  ('Beef Tenderloin',      'beef-tenderloin',      'Premium cut grilled to your liking with grilled greens.',                       24000, '₦24,000 – ₦30,000', 5.0, 'Premium',    '/images/beef-tenderloin.jpg', 'PREMIUM',       11),
  ('Chicken Satay',        'chicken-satay',        'Sticky glazed chicken grilled over coals with a creamy dip.',                   10000, '₦10,000 – ₦13,000', 4.7, 'Kebab',      '/images/chicken-satay.jpg',   null,            12)
on conflict (slug) do update set
  description = excluded.description, price = excluded.price, price_label = excluded.price_label,
  rating = excluded.rating, category = excluded.category, image = excluded.image,
  badge = excluded.badge, sort_order = excluded.sort_order;

-- Link seeded items to their category (best-effort mapping) -------------------
update public.menu_items mi set category_id = mc.id
from public.menu_categories mc
where mc.slug = case mi.category
    when 'Signature'  then 'signature-grills'
    when 'Seafood'    then 'seafood'
    when 'Premium'    then 'premium-meats'
    when 'Meat'       then 'premium-meats'
    when 'Barbecue'   then 'signature-grills'
    when 'Kebab'      then 'kebabs-satay'
    else 'sides-compliments'
  end
  and mi.category_id is distinct from mc.id;

-- Reviews: only when the table is empty (no natural unique key) ---------------
insert into public.reviews (author, role, comment, rating, source, sort_order)
select * from (values
  ('T.C.B.O (Tobz)',   'Local Guide · 131 reviews', 'Looking for the best barbecued proteins? BrightGrillz is your plug; the taste buds of King Mo Adah, Davido, E-money, Obi-Cubana and more also agree!', 5, 'google', 1),
  ('Naf2 Isa',         'Local Guide · 91 reviews',  'Nice chicken. Premium quality with perfect seasoning — every bite is worth it.', 5, 'google', 2),
  ('yahaya james',     'Verified Guest',            'The best place to be — everything is readily available. Excellent service and amazing food!', 5, 'google', 3),
  ('Omar Shamsudeen',  'Local Guide · 15 reviews',  'Tasty grill with amazing flavours. Worth every naira — highly recommended!', 5, 'google', 4),
  ('Okoro Mary',       'Local Guide · 3 reviews',   'Nice place to visit with friends and family. Great food, great service!', 5, 'google', 5),
  ('Joseph Roberts',   'Local Guide · 168 reviews', 'Awesome experience from start to finish. Food and service both top notch.', 5, 'google', 6)
) as v(author, role, comment, rating, source, sort_order)
where not exists (select 1 from public.reviews);
