import React from 'react';
import type { RecipeIngredient } from "@nutrition-data-store/types";
import { calculateRecipeTotalGrams } from '@nutrition-data-store/nutrition-lib';
import { useLocalState } from '../state/LocalState';
import { IngredientNutritionPanel } from './IngredientNutritionPanel';
import { NutritionPanelProvider } from './state/NutritionPanelState';
import './styles.css';

/**
 * Main modal component for analyzing nutrition of recipe ingredients
 */
interface NutritionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NutritionAnalysisModal({ isOpen, onClose }: NutritionAnalysisModalProps) {
  const [state] = useLocalState();
  const ingredients = state.ingredients;

  // Check if all ingredients are addressed (have portion or are skipped)
  const allIngredientsAddressed = ingredients.length > 0 && ingredients.every((ing: RecipeIngredient) =>
    ing.portion !== null || ing.status === 'skipped'
  );

  if (!isOpen) return null;

  return (
    <div className="NutritionAnalysisModal modal-overlay nutrition-analysis-modal" onClick={onClose}>
      <div
        className="modal-content modal-content--nutrition"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header__title-wrapper">
            <h3>Nutrition Analysis</h3>
            {allIngredientsAddressed && (
              <span className="completion-badge">
                ✓ All Complete
              </span>
            )}
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body modal-body--nutrition">
          {/* Intro section */}
          <div className="nutrition-intro">
            <h4 className="nutrition-intro__title">
              Recipe Ingredients
              {(() => {
                const ingredientsWithNutrition = ingredients.filter((ing: RecipeIngredient) => 
                  ing.portion?.totalGrams && typeof ing.portion.totalGrams === 'number'
                );
                if (ingredientsWithNutrition.length > 0) {
                  const totalGrams = calculateRecipeTotalGrams(ingredientsWithNutrition);
                  return (
                    <span style={{ fontWeight: '400', fontSize: '0.9em', color: '#666', marginLeft: '8px' }}>
                      ({Math.round(totalGrams)}g total)
                    </span>
                  );
                }
                return null;
              })()}
            </h4>
            <p className="nutrition-intro__description">
              Click on an ingredient to match it with a food and set portion sizes.
            </p>
          </div>

          {/* Single Column Layout - Self-Contained Ingredients */}
          <div className="ingredients-list">
            {ingredients.map((ingredient: RecipeIngredient) => (
              <NutritionPanelProvider key={ingredient.id} ingredient={ingredient}>
                <IngredientNutritionPanel
                  ingredient={ingredient}
                />
              </NutritionPanelProvider>
            ))}
          </div>						{ingredients.length === 0 && (
            <div className="empty-state">
              No ingredients found. Add some ingredients to your recipe first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}