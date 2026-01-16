import React, { useMemo } from 'react';
import type { RecipeIngredient } from "@nutrition-data-store/types";
import { SkipButton } from './SkipButton';

interface IngredientHeaderProps {
	ingredient: RecipeIngredient;
	isExpanded: boolean;
	onToggle: () => void;
}

/**
 * Header component showing ingredient status and expand/collapse toggle
 */
export function IngredientHeader({ ingredient, isExpanded, onToggle }: IngredientHeaderProps) {
	// Determine status display based on ingredient status
	const statusDisplay = useMemo(() => {
		switch (ingredient.status) {
			case 'skipped':
				return {
					text: '⊘ Skipped',
					className: 'ingredient-panel__status-indicator--skipped'
				};
			case 'matched':
			case 'converted': {
				const grams = ingredient.portion?.totalGrams;
				const gramsText = grams && typeof grams === 'number' ? ` (${Math.round(grams)}g)` : '';
				return {
					text: `✓ Uses ${gramsText}`,
					className: 'ingredient-panel__status-indicator--analyzed'
				};
			}
			case 'error':
				return {
					text: '⚠ Error',
					className: 'ingredient-panel__status-indicator--error'
				};
			case 'unprocessed':
			default:
				return {
					text: '○ Not analyzed',
					className: 'ingredient-panel__status-indicator--unanalyzed'
				};
		}
	}, [ingredient.status, ingredient.portion?.totalGrams]);

	return (
		<div
			onClick={onToggle}
			className={`ingredient-panel__header ${
				isExpanded ? 'ingredient-panel__header--expanded' : 'ingredient-panel__header--collapsed'
			}`}
		>
			<div style={{ flex: 1 }}>
				<div className="ingredient-panel__title">
					{ingredient.text}
				</div>
				<div className="ingredient-panel__status">
					<span className={`ingredient-panel__status-indicator ${statusDisplay.className}`}>
						{statusDisplay.text}
					</span>
					{ingredient.food?.name && ingredient.status !== 'skipped' && (
						<span className="ingredient-panel__food-match">→ {ingredient.food.name}</span>
					)}
					{isExpanded && (
						<SkipButton 
							ingredientId={ingredient.id} 
							currentStatus={ingredient.status}
						/>
					)}
				</div>
			</div>
      <div className={`ingredient-panel__expand-icon ${
        isExpanded ? 'ingredient-panel__expand-icon--expanded' : 'ingredient-panel__expand-icon--collapsed'
      }`}>
        ▼
      </div>
		</div>
	);
}