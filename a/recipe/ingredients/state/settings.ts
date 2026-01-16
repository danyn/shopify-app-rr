/**
 * Settings reducer - handles nutrition display preferences
 */

import type { RecipeState } from './defaultState';
import type { StandardNutrientId } from '@nutrition-data-store/types';
import { DEFAULT_VISIBLE_NUTRIENTS } from '@nutrition-data-store/nutrition-lib';

export function settings(state: RecipeState, payload: any): RecipeState {
  const { action } = payload;

  switch (action) {
    case 'togglePercentDV': {
      return {
        ...state,
        nutritionSettings: {
          ...state.nutritionSettings,
          showPercentDV: !state.nutritionSettings.showPercentDV
        }
      };
    }

    case 'setVisibleNutrients': {
      return {
        ...state,
        nutritionSettings: {
          ...state.nutritionSettings,
          visibleNutrients: payload.nutrients as StandardNutrientId[]
        }
      };
    }

    case 'toggleNutrient': {
      const nutrientId = payload.nutrientId as StandardNutrientId;
      const currentNutrients = state.nutritionSettings.visibleNutrients;
      
      const isVisible = currentNutrients.includes(nutrientId);
      
      return {
        ...state,
        nutritionSettings: {
          ...state.nutritionSettings,
          visibleNutrients: isVisible
            ? currentNutrients.filter(id => id !== nutrientId)
            : [...currentNutrients, nutrientId]
        }
      };
    }

    case 'resetToDefaults': {
      return {
        ...state,
        nutritionSettings: {
          showPercentDV: true,
          visibleNutrients: DEFAULT_VISIBLE_NUTRIENTS
        }
      };
    }

    case 'setServings': {
      const servings = Math.max(1, parseInt(payload.servings) || 1);
      return {
        ...state,
        servings
      };
    }

    default: {
      console.info('settings: NO ACTION DEFINED', { action, payload });
      return state;
    }
  }
}
