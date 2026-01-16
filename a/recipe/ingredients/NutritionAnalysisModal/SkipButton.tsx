import { useLocalState } from '../state/LocalState';

interface SkipButtonProps {
  ingredientId: string;
  currentStatus: 'unprocessed' | 'matched' | 'converted' | 'skipped' | 'error';
}

/**
 * Button component for toggling skip status on an ingredient
 * Shows in status area when not skipped, only visible when expanded and skipped
 */
export function SkipButton({ ingredientId, currentStatus }: SkipButtonProps) {
  const [recipeState, recipeDispatch] = useLocalState();
  const isSkipped = currentStatus === 'skipped';

  // Don't show in status area when skipped (will show in placeholder instead)
  if (isSkipped) return null;

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    recipeDispatch({
      type: 'ingredient',
      payload: {
        type: 'update',
        data: { 
          id: ingredientId, 
          updates: { 
            status: 'skipped'
          } 
        }
      }
    });
  };

  return (
    <button
      onClick={handleSkip}
      className="skip-button-status"
      title="Skip this ingredient"
    > 
      {/* @ts-ignore */}
      <s-icon type="page-remove" />
    </button>
  );
}
