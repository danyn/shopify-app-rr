import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import type { FoodNameSearch } from '@nutrition-data-store/types';
import { FoodSearchInput } from './FoodSearchInput';
import { FoodSearchResults } from './FoodSearchResults';
import { useMiniSearch } from '../MiniSearchContext';

interface SearchResult {
  item: FoodNameSearch;
  score: number;
}

interface FoodSearchContainerProps {
  onFoodSelect: (food: FoodNameSearch) => void;
  disabled?: boolean;
}

const searchOptions = {
  boost: { displayName: 2, baseName: 1.5, keywords: 1 }, // boost displayName matches
  fuzzy: 0.2, // allow some typos, but not too many
  prefix: true // match word prefixes
};

export const FoodSearchContainer = forwardRef<{ focusInput: () => void }, FoodSearchContainerProps>(
  function FoodSearchContainer({ onFoodSelect, disabled = false }, ref) {
  const miniSearch = useMiniSearch(); // Get MiniSearch instance from context
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Expose focusInput method to parent
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }));

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    setInputValue(query);
    
    if (!miniSearch || query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    try {
      const searchResults = miniSearch.search(query, searchOptions);
      const formattedResults: SearchResult[] = searchResults.map((result: any) => ({
        item: result as unknown as FoodNameSearch,
        score: result.score
      }));
      
      setResults(formattedResults);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setShowResults(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (currentQuery.length >= 2 && results.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
    }, 300);
  };

  const handleFoodSelect = (food: FoodNameSearch) => {
    console.log('Food selected in container V2:', food);
    setInputValue(food.displayName);
    onFoodSelect(food);
    setShowResults(false);
  };

  return (
    <div className="FoodSearchContainer food-search-container">
      <FoodSearchInput 
        ref={inputRef}
        onSearch={handleSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={!miniSearch ? "Loading food database..." : "Search for foods (e.g., 'chicken breast', 'apple', 'cheese')..."}
        value={inputValue}
      />
      {showResults && (
        <FoodSearchResults
          results={results}
          query={currentQuery}
          loading={loading}
          error={error}
          onFoodSelect={handleFoodSelect}
        />
      )}
    </div>
  );
});