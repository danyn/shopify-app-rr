import type { NutritionPanelState } from './defaultState';
import { createFoodSelectionState, normalizePreparedVolumes } from '@nutrition-data-store/nutrition-lib';

export function nutritionPanel(state: NutritionPanelState, payload: any): NutritionPanelState {
  const { type, data } = payload;

  switch (type) {

    /** set the display name and reset the UI  when fetch starts */
    case 'requestNewFoodData': {
      const { selectedFood } = data;
      return {
        ...state,
        selectedFood,
        showFoodSearch: false,
        preparation: ''
      };
    }
    /** fetch completed put the response data into state */
    case 'newFoodData': {
      const { selectedFoodData } = data;
      
      if (!selectedFoodData) {
        console.error('newFoodData: selectedFoodData is null or undefined');
        return state;
      }
      
      if (!selectedFoodData.portions || !Array.isArray(selectedFoodData.portions)) {
        console.error('newFoodData: selectedFoodData.portions is missing or invalid:', selectedFoodData);
        return state;
      }
      

      const foodSelection = createFoodSelectionState(selectedFoodData);

      

      // this is used as selected in a controlled component option > select
      let defaultPreparation = '';
      if (!foodSelection.perMl) {
        const preparedVolumes = normalizePreparedVolumes(selectedFoodData);
        if (preparedVolumes.length > 0) {
          defaultPreparation = preparedVolumes[0].preparation;
        }
      }

      return {
        ...state,
        foodSelection,
        showFoodSearch: false,
        unit: 'g', // Default to grams (all foods support weight units)
        amount: 1,
        preparation: defaultPreparation,
        savingState: 'idle',
        isAlreadySaved: false
      }
    }

    case 'setSelectedFood': {
      return {
        ...state,
        selectedFood: data,
      };
    }

    case 'setShowFoodSearch': {
      return {
        ...state,
        showFoodSearch: data
      };
    }

    case 'setAmount': {
      return {
        ...state,
        amount: data,
        savingState: 'idle'
      };
    }

    case 'setUnit': {
      return {
        ...state,
        unit: data,
        savingState: 'idle'
      };
    }

    case 'setPreparation': {
      return {
        ...state,
        preparation: data,
        savingState: 'idle'
      };
    }

    case 'loadSavedFood': {
      // Load existing ingredient with saved nutrition data
      // Sets: selectedFood, foodSelection, portion data, flags, and states
      return {
        ...state,
        selectedFood: data.selectedFood,
        foodSelection: data.foodSelection,
        showFoodSearch: false,
        amount: data.amount,
        unit: data.unit,
        preparation: data.preparation,
        isAlreadySaved: true,
        savingState: 'added' // Disabled until user makes changes
      };
    }

    case 'setSavingState': {
      const newState = {
        ...state,
        savingState: data
      };
      
      // When save completes, mark as already saved
      if (data === 'added') {
        newState.isAlreadySaved = true;
      }
      
      return newState;
    }

    case 'reset': {
      return {
        ...state,
        selectedFood: '',
        showFoodSearch: false,
        amount: 1,
        unit: 'g',
        preparation: '',
        foodSelection: null,
        savingState: 'idle',
        isAlreadySaved: false
      };
    }

    case 'initialize': {
      return {
        ...state,
        selectedFood: data.foodName || '',
        foodSelection: data.nutritionData ? createFoodSelectionState(data.nutritionData) : null,
        amount: data.measure?.amount || 1,
        unit: data.measure?.unit || 'g',
        preparation: data.measure?.preparationModifier || '',
        isAlreadySaved: !!data.measure // If measure exists, it's already saved
      };
    }

    default: {
      console.warn('NutritionPanel: NO ACTION DEFINED', { type, data });
      return state;
    }
  }
}