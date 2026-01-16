import { useLocalState } from '../state/LocalState';
import { useNutritionPanelState } from './state/NutritionPanelState';


interface ActionButtonsProps {
	canSave: boolean;
	canRemove: boolean;
	savingState: 'idle' | 'saving' | 'saved';
	onSave: () => void;
	onRemove: () => void;
}

export function ActionButtons({
	canSave,
	canRemove,
	savingState,
	onSave,
	onRemove
}: ActionButtonsProps) {
  const [nutritionState, nutritionDispatch] = useNutritionPanelState();

	return (
		<div className="action-buttons">
			{canSave && (
				<button 
					onClick={onSave}
					disabled={savingState === 'saving'}
					className={`action-buttons__save ${
						savingState === 'saving' ? 'action-buttons__save--saving' :
						savingState === 'saved' ? 'action-buttons__save--saved' :
						'action-buttons__save--normal'
					}`}
				>
					{savingState === 'saving' ? 'Saving...' : 
					 savingState === 'saved' ? '✓ Saved!' : 'Save Food Match'}
				</button>
			)}
			{canRemove && (
				<button 
					onClick={onRemove}
					className="action-buttons__remove"
				>
					Remove
				</button>
			)}
		</div>
	);
}