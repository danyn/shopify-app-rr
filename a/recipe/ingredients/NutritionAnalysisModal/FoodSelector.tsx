import React, { useRef, useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { RecipeIngredient, FoodNameSearch } from '@nutrition-data-store/types';
import { useNutritionPanelState } from './state/NutritionPanelState';
import { FoodSearchContainer } from '../FoodSearch/FoodSearchContainer';
import { createFoodSelectionState, getAvailableUnits, isVolumeUnit } from '@nutrition-data-store/nutrition-lib';

interface FoodSelectorProps {
  ingredient: RecipeIngredient;
  isExpanded: boolean;
}

/**
 * Component for searching and selecting foods for nutrition analysis
 */
export function FoodSelector({
  ingredient,
  isExpanded
}: FoodSelectorProps) {
  const [nutritionState, nutritionDispatch] = useNutritionPanelState();
  const fetcher = useFetcher();
  const foodSearchRef = useRef<{ focusInput: () => void } | null>(null);

  // Derive values from context state and ingredient
  const selectedFood = nutritionState.selectedFood || ingredient.food?.name || '';
  const showFoodSearch = nutritionState.showFoodSearch;
  const hasNutritionData = !!ingredient.portion;

  // Initialize state from ingredient when component mounts or ingredient changes
  useEffect(() => {
    if (ingredient.food) {
      // Ingredient has existing nutrition data
      const foodSelection = createFoodSelectionState(ingredient.food);
      
      // Validate preparation if it exists
      let validPreparation = '';
      if (ingredient.portion?.preparation && isVolumeUnit(ingredient.portion.unit)) {
        const availableUnits = getAvailableUnits(ingredient.food, ingredient.food.perMl);
        const isValid = availableUnits.preparedVolumes.some(
          (pv: any) => pv.preparation === ingredient.portion!.preparation
        );
        if (isValid) {
          validPreparation = ingredient.portion.preparation;
        }
      }
      
      // Load all saved food data in a single dispatch
      nutritionDispatch({
        type: 'nutritionPanel',
        payload: {
          type: 'loadSavedFood',
          data: {
            selectedFood: ingredient.food.name || '',
            foodSelection,
            amount: ingredient.portion?.amount || 1,
            unit: ingredient.portion?.unit || 'g',
            preparation: validPreparation
          }
        }
      });
      
    } else {
      // New ingredient without nutrition data - only set selectedFood to empty
      nutritionDispatch({
        type: 'nutritionPanel',
        payload: {
          type: 'setSelectedFood',
          data: ''
        }
      });
      // Don't automatically show search - let other logic handle this
    }
  }, [ingredient.id, nutritionDispatch]);

  // Process nutrition data when fetcher.data changes
  useEffect(() => {
    if (fetcher.data && !fetcher.data.error) {
      // console.log('FoodSelector: Received fetcher.data:', fetcher.data);
      nutritionDispatch({
        type: 'nutritionPanel',
        payload: {
          type: 'newFoodData',
          data: {
            selectedFoodData: fetcher.data
          }
        }
      });
    } else if (fetcher.data?.error) {
      console.error('FoodSelector: Fetcher returned error:', fetcher.data.error);
    }
  }, [fetcher.data?.timestamp, nutritionDispatch]);

  //  Auto-focus search input when switching to search mode
  useEffect(() => {
    if (showFoodSearch && foodSearchRef.current?.focusInput) {
      setTimeout(() => {
        if (foodSearchRef.current?.focusInput) {
          foodSearchRef.current.focusInput();
        }
      }, 150);
    }
  }, [showFoodSearch]);

  return (
    <div className="food-selection">
      <h5 className="food-selection__title">
        Food Match
      </h5>

      {selectedFood && !showFoodSearch ?
        <FoodName
          nutritionDispatch={nutritionDispatch}
          showFoodSearch={showFoodSearch}
          foodSearchRef={foodSearchRef}
          selectedFood={selectedFood}
        />
        :
        <FoodSearch
          nutritionDispatch={nutritionDispatch}
          foodSearchRef={foodSearchRef}
          fetcher={fetcher}
          selectedFood={selectedFood}
        />
      }

      {/* Loading State */}
      {
        fetcher.state === 'loading' && (
          <div className="loading-indicator">
            Loading nutrition data for {selectedFood}...
          </div>
        )
      }
    </div >
  );
}


type FNP = {
  nutritionDispatch: any;
  showFoodSearch: boolean;
  foodSearchRef: React.RefObject<{ focusInput: () => void } | null>;
  selectedFood: string;
}
/** Display the food name */
function FoodName({ nutritionDispatch, showFoodSearch, foodSearchRef, selectedFood }: FNP) {
  return (
    <div
      className="food-selection__selected"
      onClick={() => {
        const newShowSearch = !showFoodSearch;
        nutritionDispatch({
          type: 'nutritionPanel',
          payload: {
            type: 'setShowFoodSearch',
            data: newShowSearch
          }
        });

        // Auto-focus search input when showing search
        if (newShowSearch) {
          setTimeout(() => {
            if (foodSearchRef.current?.focusInput) {
              foodSearchRef.current.focusInput();
            }
          }, 150);
        }
      }}
    >
      <span>{selectedFood}</span>
      <span className="food-selection__change-hint">Click to change</span>
    </div>
  )
}

type FSP = {
  nutritionDispatch: any;
  foodSearchRef: React.RefObject<{ focusInput: () => void } | null>;
  fetcher: any;
  selectedFood: string;
}
/** Display the FoodSearch Input and results */
function FoodSearch({ nutritionDispatch, foodSearchRef, fetcher, selectedFood }: FSP) {
  return (
    <div className="food-selection__search-container">
      <div className="food-selection__search-input">
        <FoodSearchContainer
          ref={foodSearchRef}
          onFoodSelect={
            (food: FoodNameSearch) => {
              // Update UI into pending
              nutritionDispatch({
                type: 'nutritionPanel',
                payload: {
                  type: 'requestNewFoodData',
                  data: {
                    selectedFood: food.displayName,
                  }
                }
              });
              // result data handled by useEffect above
              fetcher.load(`/api/food/${food.foodId}`);
            }}
          disabled={false}
        />
      </div>
      {selectedFood && <SearchInputToggle nutritionDispatch={nutritionDispatch} />}
    </div >
  );
}

/* Buttons */
function SearchInputToggle({ nutritionDispatch }: { nutritionDispatch: any }) {
  return (
    <button
      onClick={() => {
        nutritionDispatch({
          type: 'nutritionPanel',
          payload: {
            type: 'setShowFoodSearch',
            data: false
          }
        });
      }}
      className="food-selection__cancel-btn"
    >
      Cancel
    </button>
  )
}