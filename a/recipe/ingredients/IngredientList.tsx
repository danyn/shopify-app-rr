import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { RecipeIngredient } from "@nutrition-data-store/types";
import { IngredientItem } from "./IngredientItem";
import { useLocalState } from "./state/LocalState";

/**
 * Sortable list of recipe ingredients with drag-and-drop reordering
 */
export function IngredientList() {
	const [state, dispatch] = useLocalState();
	const ingredients = state.ingredients;
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = ingredients.findIndex((item: RecipeIngredient) => item.id === active.id);
			const newIndex = ingredients.findIndex((item: RecipeIngredient) => item.id === over.id);

			const reorderedIngredients = arrayMove(ingredients, oldIndex, newIndex);
			dispatch({
				type: 'ingredient',
				payload: {
					type: 'reorder',
					data: { ingredients: reorderedIngredients }
				}
			});
		}
	}

	if (ingredients.length === 0) {
		return (
			<div className="IngredientList text-center" style={{ padding: '32px 0', color: '#666' }}>
				<p>No ingredients added yet.</p>
				<p className="text-sm" style={{ marginTop: '4px' }}>Add an ingredient above to get started.</p>
			</div>
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={ingredients.map((ing: RecipeIngredient) => ing.id)}
				strategy={verticalListSortingStrategy}
			>
				<div className="IngredientList space-y">
					{ingredients.map((ingredient: RecipeIngredient) => (
						<IngredientItem
							key={ingredient.id}
							ingredient={ingredient}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}