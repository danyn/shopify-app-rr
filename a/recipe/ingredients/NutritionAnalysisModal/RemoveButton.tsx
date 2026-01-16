import { useNutritionPanelState } from './state/NutritionPanelState';
import { useLocalState } from '../state/LocalState';

interface RemoveButtonProps {
  ingredientId: string;
  canRemove: boolean;
}

/**
 * Button component for removing nutrition analysis data from an ingredient
 */
export function RemoveButton({ ingredientId, canRemove }: RemoveButtonProps) {
  const [nutritionState, nutritionDispatch] = useNutritionPanelState();
  const [recipeState, recipeDispatch] = useLocalState();

  return (
    <div className="RemoveButton">
      {canRemove && (
        <button
          onClick={() => {
            const updates = {
              food: null,
              portion: null,
              status: 'unprocessed' as const,
              confidence: null,
              errorMessage: null
            };

            recipeDispatch({
              type: 'ingredient',
              payload: {
                type: 'update',
                data: { id: ingredientId, updates }
              }
            });
            
            // Reset local state
            nutritionDispatch({
              type: 'nutritionPanel',
              payload: {
                type: 'reset',
                data: null
              }
            });
          }}
          className="action-buttons__remove"
        >
          Remove
        </button>
      )}
    </div>
  );
}