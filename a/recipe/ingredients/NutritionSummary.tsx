import { useState, useMemo } from "react";
import type { RecipeIngredient, StandardNutrientId } from "@nutrition-data-store/types";
import { 
  getPercentDv,
  getSortedNutrients,
  getNutrientUnit,
  formatNutrientValue,
  formatPercentDv,
  scaleNutritionByServings,
  calculateRecipeTotalGrams
} from "@nutrition-data-store/nutrition-lib";
import { NutritionDetailsModal } from "./NutritionDetailsModal";
import { NutritionAnalysisModal } from "./NutritionAnalysisModal";
import { NutritionSettingsPanel } from "./NutritionSettingsPanel";
import { useLocalState } from "./state/LocalState";

/**
 * Component displaying nutrition totals for the recipe
 * Uses centralized nutrient config and respects user's visibility settings
 */
export function NutritionSummary() {
  const [state, dispatch] = useLocalState();
  const ingredients = state.ingredients;
  const { showPercentDV, visibleNutrients } = state.nutritionSettings;
  const servings = state.servings;
  const [selectedIngredient, setSelectedIngredient] = useState<RecipeIngredient | null>(null);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Filter out skipped ingredients from nutrition totals
  const ingredientsWithNutrition = ingredients.filter((ing: RecipeIngredient) => 
    ing.portion?.scaledNutrition && ing.status !== 'skipped'
  );
  const skippedIngredients = ingredients.filter((ing: RecipeIngredient) => ing.status === 'skipped');
  const totalIngredients = ingredients.length;
  const ingredientsToAnalyze = totalIngredients - skippedIngredients.length;

  // Calculate nutrition totals across all ingredients
  const nutritionTotals = useMemo(() => {
    if (ingredientsWithNutrition.length === 0) return null;

    // Sum up all nutrients across ingredients
    const totals: Record<StandardNutrientId, number> = {} as Record<StandardNutrientId, number>;
    
    for (const ingredient of ingredientsWithNutrition) {
      if (!ingredient.portion?.scaledNutrition) continue;
      
      for (const [nutrientId, amount] of Object.entries(ingredient.portion.scaledNutrition)) {
        if (typeof amount !== 'number') continue;
        
        if (!totals[nutrientId as StandardNutrientId]) {
          totals[nutrientId as StandardNutrientId] = 0;
        }
        totals[nutrientId as StandardNutrientId] += amount;
      }
    }

    // Calculate %DV
    const percentDvMap = getPercentDv(totals);

    // Get sorted configs based on visible nutrients
    const sortedConfigs = getSortedNutrients(visibleNutrients);

    // Build rows
    return sortedConfigs
      .map(config => {
        const value = totals[config.id] || 0;
        const percentDvResult = percentDvMap.get(config.id);

        return {
          nutrientId: config.id,
          label: config.label,
          value,
          unit: getNutrientUnit(config.id),
          percentDv: percentDvResult?.percentDv ?? null,
          precision: config.precision
        };
      })
      .filter(row => row.value > 0); // Only show nutrients with values
  }, [ingredientsWithNutrition, visibleNutrients]);

  return (
    <div className="NutritionSummary">
      {/* Header with Analysis Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: '600', margin: 0, color: '#333' }}>Nutrition Facts</h3>
        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          className="btn-primary"
          style={{ fontSize: '14px', padding: '8px 16px' }}
        >
          Analyze Nutrition
        </button>
      </div>

      {/* Analysis Progress */}
      <div style={{ background: '#f0f0f0', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
          Nutrition Analysis Progress
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          {ingredientsWithNutrition.length} / {ingredientsToAnalyze} ingredients analyzed
        </div>
        {skippedIngredients.length > 0 && (
          <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
            {skippedIngredients.length} ingredient{skippedIngredients.length !== 1 ? 's' : ''} skipped
          </div>
        )}
        {ingredientsToAnalyze > 0 && (
          <div style={{ marginTop: '8px', background: '#ddd', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div
              style={{
                background: '#007bff',
                height: '8px',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
                width: `${Math.min(100, (ingredientsWithNutrition.length / ingredientsToAnalyze) * 100)}%`
              }}
            />
          </div>
        )}
      </div>

      {/* Servings Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
          Number of Servings
        </label>
        <input
          type="number"
          value={servings}
          onChange={(e) => dispatch({
            type: 'settings',
            payload: { action: 'setServings', servings: e.target.value }
          })}
          min="1"
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Settings Toggle Button */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '1px solid #007bff',
            backgroundColor: 'white',
            color: '#007bff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          ⚙️ Display Settings
        </button>
      </div>

      {/* Nutrition totals */}
      <div>
        <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#333' }}>
          Recipe Nutrition {servings > 1 && `(${servings} servings)`}
          {ingredientsWithNutrition.length > 0 && (() => {
            const totalGrams = calculateRecipeTotalGrams(ingredientsWithNutrition);
            const gramsPerServing = servings > 1 ? totalGrams / servings : totalGrams;
            return (
              <span style={{ fontWeight: '400', fontSize: '0.9em', color: '#666', marginLeft: '8px' }}>
                ({Math.round(gramsPerServing)}g per portion)
              </span>
            );
          })()}
        </h4>

        {!nutritionTotals || nutritionTotals.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
            Click "Analyze Nutrition" to add nutrition data to your ingredients
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            {/* Header row */}
            <div 
              style={{ 
                display: 'grid',
                gridTemplateColumns: servings > 1 
                  ? (showPercentDV ? '2fr 1fr 1fr 0.8fr' : '2fr 1fr 1fr')
                  : (showPercentDV ? '2fr 1fr 0.8fr' : '2fr 1fr'),
                gap: '12px',
                padding: '10px 0',
                fontWeight: '600', 
                borderBottom: '2px solid #ddd',
                fontSize: '13px',
                color: '#666'
              }}
            >
              <span>Nutrient</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              {servings > 1 && <span style={{ textAlign: 'right' }}>Per Serving</span>}
              {showPercentDV && <span style={{ textAlign: 'right' }}>%DV*</span>}
            </div>

            {/* Data rows */}
            {nutritionTotals.map((row) => {
              // Calculate per-serving nutrition using nutrition-lib function
              const perServingNutrition = servings > 1 
                ? scaleNutritionByServings({ [row.nutrientId]: row.value }, servings)
                : null;
              const perServing = perServingNutrition?.[row.nutrientId] ?? row.value;
              const perServingPercentDvMap = servings > 1 ? getPercentDv({ [row.nutrientId]: perServing }) : null;
              const perServingPercentDv = perServingPercentDvMap?.get(row.nutrientId)?.percentDv ?? null;
              
              return (
                <div 
                  key={row.nutrientId}
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: servings > 1 
                      ? (showPercentDV ? '2fr 1fr 1fr 0.8fr' : '2fr 1fr 1fr')
                      : (showPercentDV ? '2fr 1fr 0.8fr' : '2fr 1fr'),
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                    fontSize: '13px'
                }}
              >
                <span style={{ color: '#333' }}>{row.label}</span>
                <span style={{ textAlign: 'right', fontWeight: '500' }}>
                  {formatNutrientValue(row.value, row.unit)}
                  {row.nutrientId !== 'energy-kcal' && ` ${row.unit}`}
                </span>
                {servings > 1 && (
                  <span style={{ textAlign: 'right', fontWeight: '500', color: '#555' }}>
                    {formatNutrientValue(perServing, row.unit)}
                    {row.nutrientId !== 'energy-kcal' && ` ${row.unit}`}
                  </span>
                )}
                {showPercentDV && (
                  <span style={{ textAlign: 'right', fontWeight: '500', color: '#007bff' }}>
                    {servings > 1 && perServingPercentDv !== null 
                      ? formatPercentDv(perServingPercentDv)
                      : (row.percentDv !== null ? formatPercentDv(row.percentDv) : '—')}
                  </span>
                )}
              </div>
              );
            })}
            
            {/* DV Note */}
            {showPercentDV && servings > 1 && (
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                * %DV based on per-serving amounts
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ingredient status breakdown */}
      {ingredientsWithNutrition.length > 0 && (
        <div style={{ paddingTop: '16px', borderTop: '1px solid #e0e0e0', marginTop: '16px' }}>
          <h4 style={{ fontWeight: '500', marginBottom: '8px', color: '#333' }}>Nutrition info by ingredient</h4>
          <div>
            {ingredientsWithNutrition.map((ingredient: RecipeIngredient) => (
              <div key={ingredient.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                  {ingredient.text}
                </span>
                <button
                  style={{
                    border:'none',
                    background:'transparent',
                    cursor:'pointer'
                  }}
                  className='btn-only-content'
                  onClick={() => {
                    setSelectedIngredient(ingredient);
                    setIsNutritionModalOpen(true);
                  }}
                  title='View nutrition details'
                >
                   {/* @ts-ignore */}
                    <s-icon type="info" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Analysis Modal */}
      <NutritionAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
      />

      {/* Nutrition Details Modal */}
      {selectedIngredient && (
        <NutritionDetailsModal
          ingredient={selectedIngredient}
          isOpen={isNutritionModalOpen}
          onClose={() => {
            setIsNutritionModalOpen(false);
            setSelectedIngredient(null);
          }}
        />
      )}

      {/* Nutrition Settings Modal */}
      <NutritionSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}