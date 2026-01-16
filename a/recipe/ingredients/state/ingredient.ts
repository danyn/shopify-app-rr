import type { RecipeState } from "./defaultState";
import type { RecipeIngredient } from "@nutrition-data-store/types";

export function ingredient(state: RecipeState, payload: any): RecipeState {
  const { type, data } = payload;

  switch (type) {
    case 'add': {
      const newIngredient: RecipeIngredient = {
        id: `ing_${state.nextId}`,
        text: data.text.trim(),
        order: state.ingredients.length,
        food: null,
        portion: null,
        confidence: null,
        status: 'unprocessed',
        errorMessage: null
      };
      
      return {
        ...state,
        ingredients: [...state.ingredients, newIngredient],
        nextId: state.nextId + 1
      };
    }

    case 'addParsed': {
      // Add a pre-parsed RecipeIngredient (from test file loading)
      // Assign new ID but preserve all other data including food and portion
      const parsedIngredient: RecipeIngredient = {
        ...data,
        id: `ing_${state.nextId}`,
        order: state.ingredients.length
      };
      
      return {
        ...state,
        ingredients: [...state.ingredients, parsedIngredient],
        nextId: state.nextId + 1
      };
    }

    case 'update': {
      const { id, updates } = data;
      return {
        ...state,
        ingredients: state.ingredients.map(ing => 
          ing.id === id ? { ...ing, ...updates } : ing
        )
      };
    }

    case 'remove': {
      return {
        ...state,
        ingredients: state.ingredients.filter(ing => ing.id !== data.id)
      };
    }

    case 'reorder': {
      const reorderedIngredients = data.ingredients.map((ing: RecipeIngredient, index: number) => ({
        ...ing,
        order: index
      }));
      
      return {
        ...state,
        ingredients: reorderedIngredients
      };
    }

    default: {
      console.warn('ingredient reducer: unknown type', type);
      return state;
    }
  }
}