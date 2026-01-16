import type { FoodSelectionState } from '@nutrition-data-store/nutrition-lib';

export type FoodSourceAddState = 'idle' | 'adding' | 'added';

export interface NutritionPanelState {
	selectedFood: string;
	showFoodSearch: boolean;
	amount: number;
	unit: string;
	preparation: string;
	foodSelection: FoodSelectionState | null;
	savingState: FoodSourceAddState;
	isAlreadySaved: boolean;
}

export const defaultNutritionPanelState: NutritionPanelState = {
	selectedFood: '',
	showFoodSearch: false,
	amount: 1,
	unit: 'g',
	preparation: '',
	foodSelection: null,
	savingState: 'idle',
	isAlreadySaved: false
};