import { useState, useRef } from "react";
import { useLocalState } from "./state/LocalState";

/**
 * Component for adding new ingredients to the recipe
 */
export function AddIngredient() {
	const [inputValue, setInputValue] = useState("");
	const dispatch = useLocalState('dispatch');
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) {
			dispatch({
				type: 'ingredient',
				payload: {
					type: 'add',
					data: { text: inputValue }
				}
			});
			setInputValue("");
			// Return focus to input after adding ingredient
			inputRef.current?.focus();
		}
	};

	return (
		<div className="AddIngredient ingredient-form">
			<form onSubmit={handleSubmit} className="flex gap">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="Enter ingredient (e.g., 2 cups rice, 1 lb chicken breast)"
				/>
				<button
					type="submit"
					disabled={!inputValue.trim()}
					className="btn"
				>
					Add
				</button>
			</form>
		</div>
	);
}