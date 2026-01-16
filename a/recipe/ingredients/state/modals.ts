import type { RecipeState } from "./defaultState";

export function modals(state: RecipeState, payload: any): RecipeState {
  const { type, data } = payload;

  switch (type) {
    default: {
      console.warn('modals reducer: unknown type', type);
      return state;
    }
  }
}