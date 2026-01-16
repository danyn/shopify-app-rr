import React, { useReducer, useContext } from "react";
import { defaultNutritionPanelState, type NutritionPanelState } from './defaultState';
import { nutritionPanel } from './nutritionPanel';
import type { RecipeIngredient } from "@nutrition-data-store/types";

// Create the Contexts outside component
const NutritionPanelStateContext = React.createContext<NutritionPanelState | null>(null);
const NutritionPanelDispatchContext = React.createContext<React.Dispatch<any> | null>(null);

// Logic for events is handled by a reducer outside component
function reducer(state: NutritionPanelState, action: any): NutritionPanelState {
	const { type, payload } = action;

	switch (type) {
		case 'nutritionPanel': 
			return nutritionPanel(state, payload);

		// Don't crash the reducer just warn
		default: {
			console.info('NutritionPanelState: NO ACTION DEFINED', { type, payload });
			return { ...state };
		}
	}
}

interface NutritionPanelProviderProps {
	children: React.ReactNode;
	ingredient: RecipeIngredient;
}

// Component - Export a component to use the logic
export function NutritionPanelProvider({ children, ingredient }: NutritionPanelProviderProps) {
	// Use default state - component will initialize based on ingredient
	const [state, dispatch] = useReducer(reducer, defaultNutritionPanelState);

	return (
		<NutritionPanelDispatchContext.Provider value={dispatch}>
			<NutritionPanelStateContext.Provider value={state}>
				{children}
			</NutritionPanelStateContext.Provider>
		</NutritionPanelDispatchContext.Provider>
	);
}

// Export a hook to use the above contexts in other components
export function useNutritionPanelState(give?: 'state' | 'dispatch'): any {
	const state = useContext(NutritionPanelStateContext);
	const dispatch = useContext(NutritionPanelDispatchContext);

	if (state === null || dispatch === null) {
		throw new Error('useNutritionPanelState must be used within a NutritionPanelProvider');
	}

  console.log({nutritionPanelState:state});

	if (!give) return [state, dispatch];
	if (give === 'state') return state;
	if (give === 'dispatch') return dispatch;

}