import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RecipeIngredient } from "@nutrition-data-store/types";
import { useLocalState } from './state/LocalState';
import { useState, useRef, useEffect } from 'react';

interface IngredientItemProps {
	ingredient: RecipeIngredient;
}

/**
 * Individual ingredient item with editing capabilities and drag-and-drop functionality
 */
export function IngredientItem({ ingredient }: IngredientItemProps) {
	const dispatch = useLocalState('dispatch');
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ingredient.id });
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(ingredient.text);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		setValue(ingredient.text);
	}, [ingredient.text]);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			// Place cursor at end instead of selecting all text
			const length = inputRef.current.value.length;
			inputRef.current.setSelectionRange(length, length);
		}
	}, [editing]);

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};

	function saveEdit() {
		const trimmed = value.trim();
		if (trimmed.length === 0) {
			// If emptied, revert to previous text
			setValue(ingredient.text);
		} else if (trimmed !== ingredient.text) {
			dispatch({
				type: 'ingredient',
				payload: {
					type: 'update',
					data: { id: ingredient.id, updates: { text: trimmed } }
				}
			});
		}
		setEditing(false);
	}

	return (
		<div ref={setNodeRef} style={style} className="IngredientItem ingredient-row">
			<div className="ingredient-row-inner">
				<button {...attributes} {...listeners} className="drag-handle" aria-label="Drag to reorder">⋮</button>

				<div className="ingredient-main">
					{!editing ? (
						<button
							className="ingredient-title-btn"
							onClick={() => setEditing(true)}
							aria-label={`Edit ingredient: ${ingredient.text}`}
						>
							{ingredient.text}
						</button>
					) : (
						<input
							ref={inputRef}
							className="ingredient-edit-input"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onBlur={saveEdit}
							onKeyDown={(e) => {
								if (e.key === 'Enter') saveEdit();
								if (e.key === 'Escape') {
									setValue(ingredient.text);
									setEditing(false);
								}
							}}
						/>
					)}
				</div>

				<button
					onClick={() => {
						dispatch({
							type: 'ingredient',
							payload: {
								type: 'remove',
								data: { id: ingredient.id }
							}
						});
					}}
					className="remove-btn"
					aria-label="Remove ingredient"
				>
					✕
				</button>
			</div>
		</div>
	);
}