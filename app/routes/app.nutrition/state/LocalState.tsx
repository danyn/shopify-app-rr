import React, { useReducer, useContext } from "react";
import { defaultState, type NutritionState } from './defaultState';

// Create the Contexts outside component
const LocalStateContext = React.createContext<NutritionState | null>(null);
const LocalDispatchContext = React.createContext<React.Dispatch<any> | null>(null);

/**
 * Reducer for managing nutrition panel state
 * @param state - Current state
 * @param action - Action to dispatch
 * @returns Updated state
 */
function reducer(state: NutritionState, action: any): NutritionState {
  const { type, payload } = action;

  switch (type) {
    case 'setField': {
      return {
        ...state,
        formData: {
          ...state.formData,
          [payload.field]: payload.value,
        },
      };
    }

    case 'setProduct': {
      return {
        ...state,
        selectedProduct: payload.product,
      };
    }

    case 'setSubmitting': {
      return {
        ...state,
        isSubmitting: payload.isSubmitting,
      };
    }

    case 'resetForm': {
      return {
        ...state,
        formData: defaultState.formData,
        selectedProduct: null,
        isSubmitting: false,
      };
    }

    default: {
      console.info('NutritionState: NO ACTION DEFINED', { type, payload });
      return { ...state };
    }
  }
}

/**
 * LocalState component providing state context to children
 * @param children - Child components
 */
export function LocalState({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  console.info("NutritionState::", { state });

  return (
    <LocalDispatchContext.Provider value={dispatch}>
      <LocalStateContext.Provider value={state}>
        {children}
      </LocalStateContext.Provider>
    </LocalDispatchContext.Provider>
  );
}

/**
 * Hook to access nutrition state and dispatch
 * @param give - Optional parameter to return only 'state' or 'dispatch'
 * @returns [state, dispatch] or state or dispatch based on give parameter
 */
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
