import { useState, forwardRef } from 'react';

interface FoodSearchInputProps {
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string; // Allow controlling the input value from parent
}

export const FoodSearchInput = forwardRef<HTMLInputElement, FoodSearchInputProps>(
  function FoodSearchInput({ 
    onSearch, 
    onFocus,
    onBlur,
    disabled = false, 
    placeholder = "Search for foods (e.g., 'chicken breast', 'apple', 'cheese')...",
    value: controlledValue
  }, ref) {
  const [query, setQuery] = useState('');

  // Use controlled value if provided, otherwise use internal state
  const inputValue = controlledValue !== undefined ? controlledValue : query;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only update internal state if not controlled
    if (controlledValue === undefined) {
      setQuery(value);
    }
    
    onSearch(value);
  };

  return (
    <input
      ref={ref}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="off"
      className="FoodSearchInput food-select-input"
    />
  );
});