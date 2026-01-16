import type { RecipeIngredient, StandardNutrientId, FoodNameSearch } from "@nutrition-data-store/types";
import { DEFAULT_VISIBLE_NUTRIENTS } from "@nutrition-data-store/nutrition-lib";

export interface NutritionSettings {
  showPercentDV: boolean;
  visibleNutrients: StandardNutrientId[];
}

export interface RecipeState {
  ingredients: RecipeIngredient[];
  nextId: number;
  modals: {};
  nutritionSettings: NutritionSettings;
  servings: number;
  // foodData: FoodNameSearch[];
}

export const defaultState: RecipeState = {
  nextId: 1,
  ingredients: [],
  // foodData: [],
  modals: {},
  servings: 1,
  nutritionSettings: {
    showPercentDV: true,
    visibleNutrients: DEFAULT_VISIBLE_NUTRIENTS
  }
};