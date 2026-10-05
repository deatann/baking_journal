export interface Ingredient {
  id: string;
  name: string;
  qty: number | null;
  unit: string;
  note: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  category: string;
  base_yield_qty: number | null;
  base_yield_unit: string | null;
  ingredients: Ingredient[];
  steps: string[];
  prep_time_min: number | null;
  cook_time_min: number | null;
  oven_temp_c: number | null;
  tags: string[];
  notes: string;
  source_type: "manual" | "scanned";
  source_image_path: string | null;
  is_favorite?: boolean; // legacy column, no longer used by the app
  created_at: string;
  updated_at: string;
}

export interface Bake {
  id: string;
  user_id: string;
  recipe_id: string | null;
  recipe_title_snapshot: string | null;
  baked_on: string;
  scale_factor: number;
  rating: number | null;
  notes: string;
  photo_paths: string[];
  created_at: string;
}

export function newIngredientId() {
  return `ing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_path: string | null;
  updated_at: string;
}
