import type { Route } from "./+types/route";
import type { NutritionService } from "nutrition-service/types";
import { IngredientList } from "./ingredients/IngredientList";
import { AddIngredient } from "./ingredients/AddIngredient";
import { NutritionSummary } from "./ingredients/NutritionSummary";
import { useLoaderData } from "react-router";
import { LocalState, useLocalState } from "./ingredients/state/LocalState";
import { useEffect, useState } from "react";
import "../../nutrition-analysis.css";
import { MiniSearchContext, useMiniSearch } from './ingredients/MiniSearchContext';

// Re-export the hook for backwards compatibility  
export { useMiniSearch };

export async function loader({ context }: Route.LoaderArgs) {
	try {
		// Get nutrition service binding
		const nutritionService = context.cloudflare.env.nutrition_service as unknown as NutritionService;
		
		// Fetch food data from nutrition-service (replaces direct R2 access)
		const foodNames = await nutritionService.getFoodNames();
		console.log('Loaded', foodNames.length, 'foods from nutrition-service');

		return { foodNames, ingredients: [] };
	} catch (error) {
		console.error('Failed to load food data from nutrition-service:', error);
		return { foodNames: [], ingredients: [] };
	}
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const actionType = formData.get('actionType') as string;
	
	if (actionType === 'updateIngredient') {
		// In production, this would update the database
		// For now, we'll return the update data to be handled optimistically
		const ingredientIndex = parseInt(formData.get('ingredientIndex') as string);
		const updates = JSON.parse(formData.get('updates') as string);
		
		return {
			type: 'updateIngredient',
			ingredientIndex,
			updates
		};
	}
	
	return null;
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Recipe Builder - Nutrition Calculator" },
		{ name: "description", content: "Build recipes and calculate nutrition values" },
	];
}

export default function Recipe() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<LocalState>
			<RecipeFeature loaderData={loaderData} />
		</LocalState>
	);
}

function RecipeFeature({ loaderData }: { loaderData: any }) {
	const [state, dispatch] = useLocalState();
	const [miniSearch, setMiniSearch] = useState<any>(null);
	const [miniSearchLoading, setMiniSearchLoading] = useState(true);
	
	// Initialize state with loader data
	useEffect(() => {
		dispatch({
			type: 'initialData',
			payload: loaderData
		});
	}, []);

	// Initialize MiniSearch with food data
	useEffect(() => {
		const initializeMiniSearch = async () => {
			if (loaderData.foodNames && loaderData.foodNames.length > 0 && !miniSearch) {
				try {
					setMiniSearchLoading(true);
					
					// Dynamically import MiniSearch
					const { default: MiniSearch } = await import('minisearch');
					
					// Configure MiniSearch for food search
					const miniSearchOptions = {
						fields: ['displayName', 'baseName', 'see'], // fields to index for full-text search
						storeFields: ['foodId', 'displayName', 'baseName', 'foodGroup', 'keywords', 'name', 'portions', 'perMl', 'perGram', 'dataSource'], // fields to return with search results
						idField: 'foodId',
            boost: { see: 1 }
					};

					const search = new MiniSearch(miniSearchOptions);
					search.addAll(loaderData.foodNames);
          console.log({loaderData})
					
					setMiniSearch(search);
					setMiniSearchLoading(false);
					console.log('Recipe route: MiniSearch initialized with', loaderData.foodNames.length, 'foods');
				} catch (error) {
					console.error('Failed to initialize MiniSearch:', error);
					setMiniSearchLoading(false);
				}
			}
		};

		initializeMiniSearch();
	}, [loaderData.foodNames, miniSearch]);

	return (
		<MiniSearchContext.Provider value={miniSearch}>
			<div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '32px 16px' }}>
				<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							<h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
								Recipe Builder
							</h1>
							<p style={{ color: '#666' }}>
								Add ingredients and get detailed nutrition information
							</p>
						</div>
						<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
							<div style={{ fontSize: '14px', color: '#666' }}>
								{state.ingredients.length} ingredient{state.ingredients.length !== 1 ? 's' : ''} • 
								{state.ingredients.filter((ing: any) => ing.portion).length} with nutrition data
								{miniSearchLoading && ' • Loading food database...'}
							</div>
						</div>
					</header>

					<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
						{/* Ingredients Section */}
						<div style={{minWidth:0}}>
							<div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '24px' }}>
								<h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
									Ingredients
								</h2>
								
								<AddIngredient />
								
								<div style={{ marginTop: '24px' }}>
									<IngredientList />
								</div>
							</div>
						</div>

						{/* Nutrition Facts */}
						<div style={{minWidth:0}}>
							<div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '24px', position: 'sticky', top: '32px' }}>
								<NutritionSummary />
							</div>
						</div>
					</div>
				</div>
			</div>
		</MiniSearchContext.Provider>
	);
}