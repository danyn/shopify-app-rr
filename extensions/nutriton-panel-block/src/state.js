import { createContext } from 'preact';
import { useReducer, useContext } from 'preact/hooks';
import { defaultState } from './stateDefault';

const LocalStateContext = createContext(null);
const LocalDispatchContext = createContext(null);

function reducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case 'setLoading': {
      return {
        ...state,
        loading: payload,
        error: null,
      };
    }
    
    case 'setNutritionData': {
      return {
        ...state,
        loading: false,
        error: null,
        nutritionData: payload,
      };
    }
    
    case 'setError': {
      return {
        ...state,
        loading: false,
        error: payload,
        nutritionData: null,
      };
    }

    default: {
      console.info('LocalState: NO ACTION DEFINED', { type, payload });
      return { ...state };
    }
  }
}

export function LocalState({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  return (
    <LocalDispatchContext.Provider value={dispatch}>
      <LocalStateContext.Provider value={state}>
        {children}
      </LocalStateContext.Provider>
    </LocalDispatchContext.Provider>
  );
}

export function useLocalState(give) {
  const state = useContext(LocalStateContext);
  const dispatch = useContext(LocalDispatchContext);

  if (state === null || dispatch === null) {
    throw new Error('useLocalState must be used within a LocalState provider');
  }

  if (!give) return [state, dispatch];
  if (give === 'state') return state;
  if (give === 'dispatch') return dispatch;
}
