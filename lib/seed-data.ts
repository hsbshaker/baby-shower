import type { Item } from './types';

/**
 * Seed data used as a fallback when Supabase env vars are not configured,
 * and as the source for supabase/seed.sql.
 *
 * The first 7 items were parsed from a saved copy of the public Amazon
 * baby registry page (registry id 9MNGG3PT13ZD). Ids are fixed UUIDs so
 * this data is stable across regenerations.
 */
export const SEED_ITEMS: Item[] = [
  // --- Amazon registry items ---
  {
    id: '9c5905c0-c2d9-4b25-a81b-2e4e7d23c5f5',
    name: 'Momcozy Non-Contact Digital Thermometer',
    price: 18.98,
    image_url: 'https://m.media-amazon.com/images/I/41xw3oe2+hL.jpg',
    description:
      'A non-contact digital thermometer with a fever alarm and mute/memory modes for fast, accurate readings.',
    category: 'Health',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B0CKTFD85D?colid=9MNGG3PT13ZD&coliid=I1QLE0WOKZA4GF&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I1QLE0WOKZA4GF',
    asin: 'B0CKTFD85D',
    sort_order: 0,
    is_active: true,
  },
  {
    id: '9c86810b-ec57-468e-ac61-3274e7e611f8',
    name: 'Momcozy Elite Baby Kit',
    price: 99.99,
    image_url: 'https://m.media-amazon.com/images/I/41jiCKmDl5L.jpg',
    description:
      'An all-in-one grooming, health, and cleansing kit with a nail file, nasal aspirator, thermometer, and more.',
    category: 'Health',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B0DP4TXLP9?colid=9MNGG3PT13ZD&coliid=I2CK5G7ASZAL6&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I2CK5G7ASZAL6',
    asin: 'B0DP4TXLP9',
    sort_order: 1,
    is_active: true,
  },
  {
    id: '34a1e3fa-a70e-436a-bf41-153dd8277ee9',
    name: 'Momcozy Baby Wipe Warmer',
    price: 39.99,
    image_url: 'https://m.media-amazon.com/images/I/31vu+UivVnL.jpg',
    description:
      'A spring-loaded wipe warmer with a night light and adjustable heat settings for diaper changes.',
    category: 'Nursery',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B0CNP84VXZ?colid=9MNGG3PT13ZD&coliid=I2I1DL5IEFA0H2&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I2I1DL5IEFA0H2',
    asin: 'B0CNP84VXZ',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'fc37d6ed-bc03-4fe3-8df7-4b62746bfd71',
    name: 'Momcozy KleanPal Pro Bottle Washer & Sterilizer',
    price: 299.99,
    image_url: 'https://m.media-amazon.com/images/I/317awChDkVL.jpg',
    description:
      'An all-in-one bottle washer, sterilizer, and dryer with 26 spray jets and multiple cleaning modes.',
    category: 'Feeding',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B0FFN1RJ8V?colid=9MNGG3PT13ZD&coliid=I314QNNJ1AEDID&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I314QNNJ1AEDID',
    asin: 'B0FFN1RJ8V',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'fed61ed7-7e28-4767-aeae-988789d3c4d6',
    name: 'Momcozy Portable Bottle Warmer',
    price: 79.99,
    image_url: 'https://m.media-amazon.com/images/I/41b8g6Y7jGL.jpg',
    description:
      'A portable bottle warmer that heats breast milk or water quickly while preserving nutrients.',
    category: 'Feeding',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B0DKHCWJ5G?colid=9MNGG3PT13ZD&coliid=I39DG86ZXGUZR9&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I39DG86ZXGUZR9',
    asin: 'B0DKHCWJ5G',
    sort_order: 4,
    is_active: true,
  },
  {
    id: '263f6a33-06d7-4d8d-9520-68c639e61fa4',
    name: 'Momcozy Portable Sound Machine',
    price: 27.99,
    image_url: 'https://m.media-amazon.com/images/I/51Hfz37PyVL.jpg',
    description:
      'A clip-on portable sound machine with 20 soothing sounds and a night light for naps and travel.',
    category: 'Nursery',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B0DZBMV3LM?colid=9MNGG3PT13ZD&coliid=I3KDWJF780WLMR&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I3KDWJF780WLMR',
    asin: 'B0DZBMV3LM',
    sort_order: 5,
    is_active: true,
  },
  {
    id: '6c237c7a-2174-4f00-aeb3-d3474e872d73',
    name: 'Philips Avent Natural Glass Baby Bottles (4-Pack)',
    price: 31.99,
    image_url: 'https://m.media-amazon.com/images/I/41KKzjvwVvL.jpg',
    description:
      'A 4-pack of BPA-free, slow-flow glass baby bottles built for combo feeding.',
    category: 'Feeding',
    store: 'Amazon',
    buy_url:
      'https://www.amazon.com/dp/B098YHHV3Q?colid=9MNGG3PT13ZD&coliid=I4B99XBLFWIHJ&ref_=lv_vv_wl_dp',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'amazon',
    amazon_item_id: 'I4B99XBLFWIHJ',
    asin: 'B098YHHV3Q',
    sort_order: 6,
    is_active: true,
  },

  // --- External (non-Amazon) items ---
  {
    id: 'f5957544-89bd-4340-bf35-1f13eb21b24d',
    name: 'Nestig Briar 4-in-1 Crib',
    price: 999,
    image_url:
      'https://www.nestig.com/cdn/shop/files/0001_Crib_Frontal4K_Personalizado.jpg',
    description: 'A convertible crib that grows from bassinet to toddler bed.',
    category: 'Nursery',
    store: 'Nestig',
    buy_url: 'https://www.nestig.com/products/briar-4-in-1-crib',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'external',
    amazon_item_id: null,
    asin: null,
    sort_order: 7,
    is_active: true,
  },
  {
    id: '2231dc36-b1da-47bb-b043-05a190568d38',
    name: 'Nuna VIAA CABN Compact Stroller',
    price: 550,
    image_url: 'https://nunababy.com/media/catalog/product/n/u/nuna_viaacabn_caviarccr_angle_us_web_1.png',
    description: 'A compact travel stroller in caviar black.',
    category: 'Gear',
    store: 'Crate & Barrel',
    buy_url:
      'https://www.crateandbarrel.com/nuna-viaa-cabn-caviar-black-compact-travel-stroller/s658870',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'external',
    amazon_item_id: null,
    asin: null,
    sort_order: 8,
    is_active: true,
  },
  {
    id: '721d9bc6-f788-4415-8aef-c829265ff23d',
    name: 'Nuna PIPA aire rx Infant Car Seat',
    price: 650,
    image_url:
      'https://nunababy.com/media/catalog/product/n/u/nuna_pipaairerx_caviarccr_angle_us_web_1.png',
    description: 'Lightweight infant car seat with the PIPA RELX base.',
    category: 'Gear',
    store: 'Nuna',
    buy_url: 'https://nunababy.com/usa/pipa-aire-rx',
    qty_needed: 1,
    qty_purchased: 0,
    source: 'external',
    amazon_item_id: null,
    asin: null,
    sort_order: 9,
    is_active: true,
  },
];
