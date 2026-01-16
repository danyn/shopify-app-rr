import type { RecipeIngredient } from "@nutrition-data-store/types";
import { useLocalState } from '../state/LocalState';

interface SkippedPlaceholderProps {
  ingredientId: string;
}

/**
 * Placeholder component shown when an ingredient is skipped
 * Displays message and button to include the ingredient back in analysis
 */
export function SkippedPlaceholder({ ingredientId }: SkippedPlaceholderProps) {
  const [recipeState, recipeDispatch] = useLocalState();

  const handleInclude = () => {
    // Find the ingredient to check if it has portion data
    const ingredient = recipeState.ingredients.find((ing: RecipeIngredient) => ing.id === ingredientId);
    
    // If ingredient has portion data, restore to 'matched', otherwise 'unprocessed'
    const newStatus = ingredient?.portion ? 'matched' : 'unprocessed';
    
    recipeDispatch({
      type: 'ingredient',
      payload: {
        type: 'update',
        data: { 
          id: ingredientId, 
          updates: { 
            status: newStatus
          } 
        }
      }
    });
  };

  return (
    <div className="skipped-placeholder">
      <div className="skipped-placeholder__icon">⊘</div>
      <div className="skipped-placeholder__title">Nutrition Skipped</div>
      <div className="skipped-placeholder__message">
        This ingredient won't contribute to nutrition totals.
      </div>
      <button
        onClick={handleInclude}
        className="skipped-placeholder__include-button"
      >
        Include in Analysis
      </button>
    </div>
  );
}
