import type { StandardNutrientId } from "@nutrition-data-store/types";
import { NUTRIENT_CONFIG } from "@nutrition-data-store/nutrition-lib";
import { useLocalState } from "./state/LocalState";

interface NutritionSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Settings modal for nutrition display preferences
 * - Toggle %DV display on/off
 * - Select which nutrients to show (checkboxes with instant updates)
 */
export function NutritionSettingsPanel({ isOpen, onClose }: NutritionSettingsPanelProps) {
  const state = useLocalState('state');
  const dispatch = useLocalState('dispatch');
  const { showPercentDV, visibleNutrients } = state.nutritionSettings;

  if (!isOpen) return null;

  // Group nutrients by category for organized display
  const nutrientsByCategory = Object.entries(NUTRIENT_CONFIG).reduce((acc, [id, config]) => {
    const category = config.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      id: id as StandardNutrientId,
      label: config.label,
      order: config.order,
      hasDailyValue: config.hasDailyValue
    });
    return acc;
  }, {} as Record<string, Array<{ id: StandardNutrientId; label: string; order: number; hasDailyValue: boolean }>>);

  // Sort nutrients within each category by order
  Object.values(nutrientsByCategory).forEach(nutrients => {
    nutrients.sort((a, b) => a.order - b.order);
  });

  const categoryOrder = ['macronutrients', 'vitamins', 'minerals', 'other'];

  const handleTogglePercentDV = () => {
    dispatch({ type: 'settings', payload: { action: 'togglePercentDV' } });
  };

  const handleToggleNutrient = (nutrientId: StandardNutrientId) => {
    dispatch({ 
      type: 'settings', 
      payload: { action: 'toggleNutrient', nutrientId } 
    });
  };

  const handleResetToDefaults = () => {
    dispatch({ type: 'settings', payload: { action: 'resetToDefaults' } });
  };

  const handleSelectAll = () => {
    const allNutrientIds = Object.keys(NUTRIENT_CONFIG) as StandardNutrientId[];
    dispatch({
      type: 'settings',
      payload: { action: 'setVisibleNutrients', nutrients: allNutrientIds }
    });
  };

  const handleDeselectAll = () => {
    dispatch({
      type: 'settings',
      payload: { action: 'setVisibleNutrients', nutrients: [] }
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            Nutrition Display Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px' }}>
          {/* %DV Toggle */}
          <div style={{ 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #dee2e6'
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          <input
            type="checkbox"
            checked={showPercentDV}
            onChange={handleTogglePercentDV}
            style={{ 
              marginRight: '8px',
              cursor: 'pointer',
              width: '16px',
              height: '16px'
            }}
          />
          <span style={{ fontWeight: '500' }}>Show % Daily Value (%DV)</span>
        </label>
        <div style={{ 
          marginLeft: '24px', 
          marginTop: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          Display the percentage of FDA daily values for each nutrient
        </div>
      </div>

      {/* Visible Nutrients Section */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h4 style={{ 
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#333'
          }}>
            Visible Nutrients
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #007bff',
                backgroundColor: 'white',
                color: '#007bff',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #6c757d',
                backgroundColor: 'white',
                color: '#6c757d',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Deselect All
            </button>
            <button
              onClick={handleResetToDefaults}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #28a745',
                backgroundColor: 'white',
                color: '#28a745',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div style={{ 
          fontSize: '12px',
          color: '#666',
          marginBottom: '12px'
        }}>
          Select which nutrients to display in nutrition summaries ({visibleNutrients.length} selected)
        </div>

        {/* Nutrient checkboxes organized by category */}
        {categoryOrder.map(category => {
          const nutrients = nutrientsByCategory[category];
          if (!nutrients || nutrients.length === 0) return null;

          return (
            <div key={category} style={{ marginBottom: '20px' }}>
              <h5 style={{ 
                margin: '0 0 12px 0',
                fontSize: '13px',
                fontWeight: '600',
                color: '#495057',
                textTransform: 'capitalize'
              }}>
                {category}
              </h5>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px 16px',
                marginLeft: '12px',
                marginBottom: '8px'
              }}>
                {nutrients.map(nutrient => {
                  const isChecked = visibleNutrients.includes(nutrient.id);
                  return (
                    <label
                      key={nutrient.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '6px',
                        alignItems: 'start',
                        cursor: 'pointer',
                        fontSize: '13px',
                        padding: '6px 0',
                        minHeight: '28px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleNutrient(nutrient.id)}
                        style={{
                          marginTop: '2px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ 
                        color: isChecked ? '#333' : '#999',
                        lineHeight: '1.4'
                      }}>
                        {nutrient.label}
                        {!nutrient.hasDailyValue && (
                          <span style={{ 
                            marginLeft: '4px',
                            fontSize: '11px',
                            color: '#999',
                            fontStyle: 'italic',
                            whiteSpace: 'nowrap'
                          }}>
                            (no DV)
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
        </div>
      </div>
    </div>
  );
}
