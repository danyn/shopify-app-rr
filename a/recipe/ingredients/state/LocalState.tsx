import React, { useReducer, useContext } from "react";
import { defaultState, type RecipeState } from './defaultState';
import { ingredient } from './ingredient';
import { modals } from './modals';
import { settings } from './settings';
import type { FoodNameSearch } from "@nutrition-data-store/types";

// Create the Contexts outside component
const LocalStateContext = React.createContext<RecipeState | null>(null);
const LocalDispatchContext = React.createContext<React.Dispatch<any> | null>(null);

// Logic for events is handled by a reducer outside component
function reducer(state: RecipeState, action: any): RecipeState {
  const { type, payload } = action;

  switch(type) {
    case 'initialData': {
      return {
        ...state,
        // foodData: payload.foodData || [],
        ingredients: payload.ingredients || []
      };
    }

    // Sub Modules
    case 'ingredient': return ingredient(state, payload);
    case 'modals': return modals(state, payload);
    case 'settings': return settings(state, payload);

    // Don't crash the reducer just warn
    default: {
      console.info('RecipeState: NO ACTION DEFINED', { type, payload });
      return { ...state };
    }
  }
}

// Component - Export a component to use the logic
export function LocalState({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  console.info("RecipeState::", { state });

  return (
    <LocalDispatchContext.Provider value={dispatch}>
      <LocalStateContext.Provider value={state}>
        {children}
      </LocalStateContext.Provider>
    </LocalDispatchContext.Provider>
  );
}

// Export a hook to use the above contexts in other components
export function useLocalState(give?: 'state' | 'dispatch'): any {
  const state = useContext(LocalStateContext);
  const dispatch = useContext(LocalDispatchContext);
  
  if (state === null || dispatch === null) {
    throw new Error('useLocalState must be used within a LocalState provider');
  }
  
  if (!give) return [state, dispatch];
  if (give === 'state') return state;
  if (give === 'dispatch') return dispatch;
}