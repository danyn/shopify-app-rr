import React, { useState, useRef, useEffect } from 'react';
import type { RecipeIngredient } from "@nutrition-data-store/types";
import { useLocalState } from '../state/LocalState';
import { useNutritionPanelState } from './state/NutritionPanelState';

// Components
import { IngredientHeader } from './IngredientHeader';
import { FoodSelector } from './FoodSelector';
import { PortionEditor } from './PortionEditor';
import { SaveButton } from './SaveButton';
import { RemoveButton } from './RemoveButton';
import { SkippedPlaceholder } from './SkippedPlaceholder';

interface IngredientNutritionPanelProps {
	ingredient: RecipeIngredient;
}

/**
 * Complete nutrition analysis panel for a single ingredient
 * Each panel manages its own expanded/collapsed state
 */
export function IngredientNutritionPanel({
	ingredient
}: IngredientNutritionPanelProps) {
	const [recipeState, recipeDispatch] = useLocalState();
	const [nutritionState, nutritionDispatch] = useNutritionPanelState();
	const [isExpanded, setIsExpanded] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	const handleToggle = () => {
		const willExpand = !isExpanded;
		setIsExpanded(willExpand);
		
		// Scroll behavior based on expand/collapse
		setTimeout(() => {
			if (willExpand && panelRef.current) {
				// When opening: scroll panel to top of view
				panelRef.current.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'start'
				});
			} else {
				// When closing: scroll to top of list to show more items
				const listContainer = panelRef.current?.closest('.ingredients-list');
				listContainer?.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}, 50);
	};

	return (
		<div ref={panelRef} className={`ingredient-panel ${isExpanded ? 'ingredient-panel--expanded' : ''}`}>
			{/* Ingredient Header - Always Visible */}
			<IngredientHeader 
				ingredient={ingredient}
				isExpanded={isExpanded}
				onToggle={handleToggle}
			/>

			{/* Expandable Content */}
			{isExpanded && (
				<div className="ingredient-panel__content">
					{ingredient.status === 'skipped' ? (
						<SkippedPlaceholder ingredientId={ingredient.id} />
					) : (
						/* Normal Analysis Interface */
						<>
							{/* Food Selection Section - Now Self-Contained */}
							<FoodSelector
								ingredient={ingredient}
								isExpanded={isExpanded}
							/>

							{/* Portion Selection - Only show when food data is available */}
							{nutritionState.foodSelection?.food && (
								<PortionEditor />
							)}

							{/* Action Buttons */}
							<div className="action-buttons">
								<SaveButton ingredientId={ingredient.id} />
								<RemoveButton 
									ingredientId={ingredient.id} 
									canRemove={!!ingredient.portion} 
								/>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}