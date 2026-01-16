import React from 'react';
import { isVolumeUnit, getAvailableUnits } from '@nutrition-data-store/nutrition-lib';
import { useNutritionPanelState } from './state/NutritionPanelState';

/**
 * Component for editing portion size, unit, and preparation for nutrition calculation
 */
export function PortionEditor() {
  const [nutritionState, nutritionDispatch] = useNutritionPanelState();

  const {
    amount,
    unit,
    preparation,
    foodSelection
  } = nutritionState;

  // This component should only be rendered when foodSelection exists
  if (!foodSelection?.food) {
    console.warn('PortionEditor rendered without foodSelection - this should not happen');
    return (
      <div className="portion-selection">
        <div className="portion-selection__error">
          No food selected. Please select a food first.
        </div>
      </div>
    );
  }

  // Get available units using nutrition-lib function
  const availableUnits = React.useMemo(() => {
    return getAvailableUnits(foodSelection.food, foodSelection.perMl);
  }, [foodSelection]);

  return (
    <div className="portion-selection">
      <h5 className="portion-selection__title">
        Portion Size
      </h5>

      <div className="portion-selection__inputs">
        <div className="portion-selection__field">
          <label className="portion-selection__label">
            Amount:
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              nutritionDispatch({
                type: 'nutritionPanel',
                payload: {
                  type: 'setAmount',
                  data: Number(e.target.value)
                }
              });
            }}
            step="0.1"
            min="0"
            className="portion-selection__input"
          />
        </div>
        <div className="portion-selection__field">
          <label className="portion-selection__label">
            Unit:
          </label>
          <select
            value={unit}
            onChange={(e) => {
              const newUnit = e.target.value;
              nutritionDispatch({
                type: 'nutritionPanel',
                payload: {
                  type: 'setUnit',
                  data: newUnit
                }
              });

              // Reset preparation if switching to a non-volume unit
              if (!isVolumeUnit(newUnit)) {
                nutritionDispatch({
                  type: 'nutritionPanel',
                  payload: {
                    type: 'setPreparation',
                    data: ''
                  }
                });
              } else if (preparation && isVolumeUnit(newUnit)) {
                // If staying with volume units, check if current preparation is still valid
                const validPreparation = availableUnits.preparedVolumes.some(
                  (pv: any) => pv.preparation === preparation
                );

                if (!validPreparation) {
                  nutritionDispatch({
                    type: 'nutritionPanel',
                    payload: {
                      type: 'setPreparation',
                      data: ''
                    }
                  });
                }
              }
            }}
            className="portion-selection__select"
          >
            {/* Always show weight units (all foods have perGram) */}
            {availableUnits.weights.length > 0 && (
              <optgroup label="Weights">
                {availableUnits.weights.map((weightUnit: string) => (
                  <option key={weightUnit} value={weightUnit}>{weightUnit}</option>
                ))}
              </optgroup>
            )}

            {/* Show volume units if food has perMl or prepared volumes */}
            {availableUnits.volumes.length > 0 && (
              <optgroup label="Volumes">
                {availableUnits.volumes.map((volumeUnit: string) => (
                  <option key={volumeUnit} value={volumeUnit}>{volumeUnit}</option>
                ))}
              </optgroup>
            )}

            {/* Show subjective portions */}
            {foodSelection.subjectivePortions.length > 0 && (
              <optgroup label="Portions">
                {foodSelection.subjectivePortions.map((portion: any) => (
                  <option key={portion.id} value={portion.description}>
                    {portion.description}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Preparation Selector - only show if prepared volumes are available and volume unit is selected */}
      {availableUnits.preparedVolumes &&
        availableUnits.preparedVolumes.length > 0 &&
        isVolumeUnit(unit) && (
          <div className="portion-selection__preparation">
            <label className="portion-selection__label">
              Preparation
            </label>
            <select
              value={preparation}
              onChange={(e) => {
                nutritionDispatch({
                  type: 'nutritionPanel',
                  payload: {
                    type: 'setPreparation',
                    data: e.target.value
                  }
                });
              }}
              className="portion-selection__select"
            >
              {/* If food has base perMl, show "Base volume" option. Otherwise, preparation is required */}
              {foodSelection.perMl && <option value="">Basic volume</option>}
              {availableUnits.preparedVolumes?.map((prepVolume: any) => (
                <option key={prepVolume.preparation} value={prepVolume.preparation}>
                  {prepVolume.displayName}
                </option>
              )) || []}
            </select>
            {preparation && availableUnits.preparedVolumes && (
              <div className="portion-selection__preparation-hint">
                Using density for {preparation} preparation: {availableUnits.preparedVolumes.find((pv: any) => pv.preparation === preparation)?.perMl}g/ml
              </div>
            )}
          </div>
        )}
    </div>
  );
}