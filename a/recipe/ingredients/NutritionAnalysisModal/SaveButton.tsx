import { calculateNutritionForMeasure, determineSelectionType } from '@nutrition-data-store/nutrition-lib';
import type { UserMeasureSelection } from '@nutrition-data-store/nutrition-lib';
import { useNutritionPanelState } from './state/NutritionPanelState';
import { useLocalState } from '../state/LocalState';
import type { NutritionPanelState } from './state/defaultState';

interface SaveButtonProps {
  ingredientId: string;
}

/**
 * Button component for saving nutrition analysis results to ingredient
 */
export function SaveButton({ ingredientId }: SaveButtonProps) {
  const [nutritionState, nutritionDispatch] = useNutritionPanelState();
  const [recipeState, recipeDispatch] = useLocalState();
  
  const {
    // selectedFood,
    foodSelection,
    amount,
    unit,
    preparation,
    savingState,
    isAlreadySaved
  } = nutritionState as NutritionPanelState;


  const handleSave = () => {
    if (!foodSelection) return;
    
    nutritionDispatch({
      type: 'nutritionPanel',
      payload: {
        type: 'setSavingState',
        data: 'adding'
      }
    });

    try {
      // Determine the correct selection type based on unit, preparation, and food capabilities
      const selectionType = determineSelectionType(unit, preparation, !!foodSelection.perMl);
      
      // Build user selection object
      const userSelection: UserMeasureSelection = {
        amount,
        unit,
        type: selectionType,
        preparation: selectionType === 'preparedVolume' ? preparation : undefined
      };

      // Calculate nutrition - function handles all conversion logic internally
      const nutritionResult = calculateNutritionForMeasure(
        foodSelection,
        userSelection
      );

      console.log({nutritionResult});

      const updates = {
        // Include the complete food object (contains perGram, perMl, portions, etc.)
        food: foodSelection.food,
        
        // Combine user selection and calculated nutrition into portion object
        portion: {
          // User's measure selection
          amount,
          unit,
          type: userSelection.type,
          preparation: selectionType === 'preparedVolume' ? preparation : null,
          
          // Calculated nutrition for this portion
          totalGrams: nutritionResult.totalGrams,
          totalMl: nutritionResult.totalMl || null,
          scaledNutrition: nutritionResult.scaledNutrition,
          conversionPath: nutritionResult.conversionPath || null
        },
        
        // Processing status
        confidence: 'high' as const,
        status: 'matched' as const,
        errorMessage: null
      };

      recipeDispatch({
        type: 'ingredient',
        payload: {
          type: 'update',
          data: { id: ingredientId, updates }
        }
      });

      // Set to 'added' state - stays until user changes selection
      nutritionDispatch({
        type: 'nutritionPanel',
        payload: {
          type: 'setSavingState',
          data: 'added'
        }
      });

    } catch (error) {
      console.error('Error adding food source:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Unable to add food source: ${errorMessage}`);
      
      nutritionDispatch({
        type: 'nutritionPanel',
        payload: {
          type: 'setSavingState',
          data: 'idle'
        }
      });
    }
  };

  return (
    <div className="SaveButton">
      {foodSelection?.food && (
        savingState === 'added' ? (
          <div className="saved-indicator">✓ Added</div>
        ) : (
          <button
            onClick={handleSave}
            disabled={savingState === 'adding'}
            className={`action-buttons__save ${
              savingState === 'adding' ? 'action-buttons__save--adding' :
              (isAlreadySaved && savingState === 'idle') ? 'action-buttons__save--update' :
              'action-buttons__save--normal'
            }`}
          >
            {savingState === 'adding' ? 'Adding...' :
             (isAlreadySaved && savingState === 'idle') ? 'Update Food Source' :
             'Add Food Source'}
          </button>
        )
      )}
    </div>
  );
}
