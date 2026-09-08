-- ============================================================================
-- Baby registry — seed data
--
-- HOW TO RUN: run supabase/migrations/0001_init.sql first, then paste this
-- file into the Supabase SQL Editor and click "Run". Safe to re-run: Amazon
-- rows are skipped on conflict (amazon_item_id), external rows are plain
-- inserts (remove them first if you re-run and don't want duplicates).
-- ============================================================================

insert into items (
  id, name, price, image_url, description, category, store, buy_url,
  qty_needed, qty_purchased, source, amazon_item_id, asin, sort_order, is_active
) values
  ('9c5905c0-c2d9-4b25-a81b-2e4e7d23c5f5', 'Momcozy Non-Contact Digital Thermometer', 18.98, 'https://m.media-amazon.com/images/I/41xw3oe2+hL.jpg', 'A non-contact digital thermometer with a fever alarm and mute/memory modes for fast, accurate readings.', 'Health', 'Amazon', 'https://www.amazon.com/dp/B0CKTFD85D?colid=9MNGG3PT13ZD&coliid=I1QLE0WOKZA4GF&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I1QLE0WOKZA4GF', 'B0CKTFD85D', 0, true),
  ('9c86810b-ec57-468e-ac61-3274e7e611f8', 'Momcozy Elite Baby Kit', 99.99, 'https://m.media-amazon.com/images/I/41jiCKmDl5L.jpg', 'An all-in-one grooming, health, and cleansing kit with a nail file, nasal aspirator, thermometer, and more.', 'Health', 'Amazon', 'https://www.amazon.com/dp/B0DP4TXLP9?colid=9MNGG3PT13ZD&coliid=I2CK5G7ASZAL6&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I2CK5G7ASZAL6', 'B0DP4TXLP9', 1, true),
  ('34a1e3fa-a70e-436a-bf41-153dd8277ee9', 'Momcozy Baby Wipe Warmer', 39.99, 'https://m.media-amazon.com/images/I/31vu+UivVnL.jpg', 'A spring-loaded wipe warmer with a night light and adjustable heat settings for diaper changes.', 'Nursery', 'Amazon', 'https://www.amazon.com/dp/B0CNP84VXZ?colid=9MNGG3PT13ZD&coliid=I2I1DL5IEFA0H2&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I2I1DL5IEFA0H2', 'B0CNP84VXZ', 2, true),
  ('fc37d6ed-bc03-4fe3-8df7-4b62746bfd71', 'Momcozy KleanPal Pro Bottle Washer & Sterilizer', 299.99, 'https://m.media-amazon.com/images/I/317awChDkVL.jpg', 'An all-in-one bottle washer, sterilizer, and dryer with 26 spray jets and multiple cleaning modes.', 'Feeding', 'Amazon', 'https://www.amazon.com/dp/B0FFN1RJ8V?colid=9MNGG3PT13ZD&coliid=I314QNNJ1AEDID&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I314QNNJ1AEDID', 'B0FFN1RJ8V', 3, true),
  ('fed61ed7-7e28-4767-aeae-988789d3c4d6', 'Momcozy Portable Bottle Warmer', 79.99, 'https://m.media-amazon.com/images/I/41b8g6Y7jGL.jpg', 'A portable bottle warmer that heats breast milk or water quickly while preserving nutrients.', 'Feeding', 'Amazon', 'https://www.amazon.com/dp/B0DKHCWJ5G?colid=9MNGG3PT13ZD&coliid=I39DG86ZXGUZR9&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I39DG86ZXGUZR9', 'B0DKHCWJ5G', 4, true),
  ('263f6a33-06d7-4d8d-9520-68c639e61fa4', 'Momcozy Portable Sound Machine', 27.99, 'https://m.media-amazon.com/images/I/51Hfz37PyVL.jpg', 'A clip-on portable sound machine with 20 soothing sounds and a night light for naps and travel.', 'Nursery', 'Amazon', 'https://www.amazon.com/dp/B0DZBMV3LM?colid=9MNGG3PT13ZD&coliid=I3KDWJF780WLMR&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I3KDWJF780WLMR', 'B0DZBMV3LM', 5, true),
  ('6c237c7a-2174-4f00-aeb3-d3474e872d73', 'Philips Avent Natural Glass Baby Bottles (4-Pack)', 31.99, 'https://m.media-amazon.com/images/I/41KKzjvwVvL.jpg', 'A 4-pack of BPA-free, slow-flow glass baby bottles built for combo feeding.', 'Feeding', 'Amazon', 'https://www.amazon.com/dp/B098YHHV3Q?colid=9MNGG3PT13ZD&coliid=I4B99XBLFWIHJ&ref_=lv_vv_wl_dp', 1, 0, 'amazon', 'I4B99XBLFWIHJ', 'B098YHHV3Q', 6, true)
on conflict (amazon_item_id) do nothing;

insert into items (
  id, name, price, image_url, description, category, store, buy_url,
  qty_needed, qty_purchased, source, amazon_item_id, asin, sort_order, is_active
) values
  ('f5957544-89bd-4340-bf35-1f13eb21b24d', 'Nestig Briar 4-in-1 Crib', 999.00, 'https://www.nestig.com/cdn/shop/files/0001_Crib_Frontal4K_Personalizado.jpg', 'A convertible crib that grows from bassinet to toddler bed.', 'Nursery', 'Nestig', 'https://www.nestig.com/products/briar-4-in-1-crib', 1, 0, 'external', null, null, 7, true),
  ('2231dc36-b1da-47bb-b043-05a190568d38', 'Nuna VIAA CABN Compact Stroller', 550.00, 'https://nunababy.com/media/catalog/product/n/u/nuna_viaacabn_caviarccr_angle_us_web_1.png', 'A compact travel stroller in caviar black.', 'Gear', 'Crate & Barrel', 'https://www.crateandbarrel.com/nuna-viaa-cabn-caviar-black-compact-travel-stroller/s658870', 1, 0, 'external', null, null, 8, true),
  ('721d9bc6-f788-4415-8aef-c829265ff23d', 'Nuna PIPA aire rx Infant Car Seat', 650.00, 'https://nunababy.com/media/catalog/product/n/u/nuna_pipaairerx_caviarccr_angle_us_web_1.png', 'Lightweight infant car seat with the PIPA RELX base.', 'Gear', 'Nuna', 'https://nunababy.com/usa/pipa-aire-rx', 1, 0, 'external', null, null, 9, true);
