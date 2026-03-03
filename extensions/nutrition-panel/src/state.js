import { createContext } from 'preact';
import { useReducer, useContext } from 'preact/hooks';
import { defaultState } from './stateDefault';
import { RegionSelector, ImageUpload, FormInputs } from './stateModules';

const LocalStateContext = createContext(null);
const LocalDispatchContext = createContext(null);

function reducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case 'initialData': {
      return {
        ...state,
        id: payload.id || null,
        loading: false,
        FormInputs: {
          ...state.FormInputs,
          name: payload.name || "",
          calories: payload.calories || 0,
          protein: payload.protein || 0,
          carbs: payload.carbs || 0,
        },
        ImageUpload: {
          ...state.ImageUpload,
          image: payload.image || "",
          imageUrl: payload.imageUrl || "",
        },
      };
    }

    case 'setSaving': {
      return {
        ...state,
        saving: payload.saving,
      };
    }

    // Submodules
    case 'RegionSelector': return RegionSelector(state, payload);
    case 'ImageUpload': return ImageUpload(state, payload);
    case 'FormInputs': return FormInputs(state, payload);

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
