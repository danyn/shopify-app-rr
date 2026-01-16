import { useMemo } from "react";
import { 
	getNutrientUnit, 
	formatNutrientValue, 
	getPercentDv,
	getSortedNutrients,
	formatPercentDv
} from "@nutrition-data-store/nutrition-lib";
import type { RecipeIngredient, StandardNutrientId } from "@nutrition-data-store/types";
import { useLocalState } from "./state/LocalState";

interface NutritionDetailsModalProps {
	ingredient: RecipeIngredient;
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Modal showing detailed nutrition information for a single ingredient
 * Uses centralized nutrient config and respects user's visibility settings
 */
export function NutritionDetailsModal({ ingredient, isOpen, onClose }: NutritionDetailsModalProps) {
	const state = useLocalState('state');
	const { showPercentDV, visibleNutrients } = state.nutritionSettings;
	const servings = state.servings;

	if (!isOpen || !ingredient.food?.name) return null;

	// Get scaled nutrition and calculate %DV per serving
	const nutritionData = useMemo(() => {
		if (!ingredient?.portion?.scaledNutrition || servings < 1) return null;

		const scaledNutrition = ingredient.portion.scaledNutrition;
		
		// Calculate per-serving nutrition (divide total ingredient by servings)
		const perServingNutrition: Record<string, number> = {};
		for (const [nutrientId, value] of Object.entries(scaledNutrition)) {
			perServingNutrition[nutrientId] = value / servings;
		}
		
		const percentDvMap = getPercentDv(perServingNutrition);

		// Get sorted nutrient configs based on user's visible nutrients
		const sortedConfigs = getSortedNutrients(visibleNutrients);

		// Build rows with nutrition data
		return sortedConfigs
			.map(config => {
				const value = perServingNutrition[config.id] || 0;
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
	}, [ingredient?.portion?.scaledNutrition, servings, visibleNutrients]);

	return (
		<div className="NutritionDetailsModal modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>Nutrition Facts</h3>
					<button onClick={onClose} className="close-btn">×</button>
				</div>

				<div className="modal-body">
					<div className="nutrition-header">
						<h4>{ingredient.food?.name}</h4>
						<p className="portion-info">
              {ingredient.portion?.totalGrams && 
               <> Per serving ({(ingredient.portion.totalGrams / servings).toFixed(0)}g)</>
              }
							
						</p>
					</div>

					{!nutritionData || nutritionData.length === 0 ? (
						<p style={{ color: '#999', fontStyle: 'italic' }}>No nutrition data available</p>
					) : (
						<div className="nutrition-table" style={{ width: '100%' }}>
							{/* Header row */}
							<div 
								className="nutrition-row nutrition-header-row" 
								style={{ 
									display: 'grid',
									gridTemplateColumns: showPercentDV ? '2fr 1fr 0.8fr' : '2fr 1fr',
									gap: '12px',
									padding: '12px 0',
									fontWeight: '600', 
									borderBottom: '2px solid #ddd',
									fontSize: '14px',
									color: '#666'
								}}
							>
								<span>Nutrient</span>
								<span style={{ textAlign: 'right' }}>Amount</span>
								{showPercentDV && <span style={{ textAlign: 'right' }}>%DV</span>}
							</div>

							{/* Data rows */}
							{nutritionData.map((row) => (
								<div 
									key={row.nutrientId} 
									className="nutrition-row"
									style={{ 
										display: 'grid',
										gridTemplateColumns: showPercentDV ? '2fr 1fr 0.8fr' : '2fr 1fr',
										gap: '12px',
										padding: '10px 0',
										borderBottom: '1px solid #eee',
										fontSize: '14px'
									}}
								>
									<span style={{ color: '#333' }}>{row.label}</span>
									<span style={{ textAlign: 'right', fontWeight: '500' }}>
										{formatNutrientValue(row.value, row.unit)}
										{row.nutrientId !== 'energy-kcal' && ` ${row.unit}`}
									</span>
									{showPercentDV && (
										<span style={{ textAlign: 'right', fontWeight: '500', color: '#007bff' }}>
											{row.percentDv !== null ? formatPercentDv(row.percentDv) : '—'}
										</span>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button onClick={onClose} className="btn-secondary">Close</button>
				</div>
			</div>
		</div>
	);
}