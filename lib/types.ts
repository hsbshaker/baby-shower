export const CATEGORIES = ['Nursery', 'Feeding', 'Clothing', 'Gear', 'Bath', 'Health', 'Play'] as const;
export type Category = (typeof CATEGORIES)[number];
export type Source = 'amazon' | 'external';

export interface Item {
  id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  description: string | null;
  category: Category;
  store: string;
  buy_url: string;
  qty_needed: number;
  qty_purchased: number;
  source: Source;
  amazon_item_id: string | null;
  asin: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
