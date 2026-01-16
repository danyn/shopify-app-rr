import type { FoodNameSearch } from '@nutrition-data-store/types';

interface SearchResult {
  item: FoodNameSearch;
  score: number;
}

interface FoodSearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
  error: string | null;
  onFoodSelect: (food: FoodNameSearch) => void;
}

export function FoodSearchResults({ 
  results, 
  query, 
  loading, 
  error, 
  onFoodSelect 
}: FoodSearchResultsProps) {
  if (loading) {
    return (
      <div className="FoodSearchResults food-search-results">
        <div className="loading" style={{
          padding: '24px',
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic'
        }}>Loading food database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="FoodSearchResults food-search-results">
        <div className="error" style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '6px',
          border: '1px solid #fecaca'
        }}>{error}</div>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="FoodSearchResults food-search-results">
        <div className="no-results" style={{
          padding: '24px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '14px'
        }}>Start typing to search for foods...</div>
      </div>
    );
  }

  if (query.length < 2) {
    return (
      <div className="FoodSearchResults food-search-results">
        <div className="no-results" style={{
          padding: '24px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '14px'
        }}>Type at least 2 characters...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="FoodSearchResults food-search-results">
        <div className="no-results" style={{
          padding: '24px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '14px'
        }}>No foods found. Try different keywords.</div>
      </div>
    );
  }

  return (
    <div className="FoodSearchResults food-search-results" style={{
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      backgroundColor: 'white',
      marginTop: '4px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {results.slice(0, 20).map((result, index) => (
        <div 
          key={`${result.item.foodId}-${index}`}
          className="result-item"
          onMouseDown={(e) => {
            // Prevent the input from losing focus on mousedown
            e.preventDefault();
            onFoodSelect(result.item);
          }}
          onClick={() => onFoodSelect(result.item)}
          style={{
            padding: '12px 16px',
            borderBottom: index < results.slice(0, 20).length - 1 ? '1px solid #f3f4f6' : 'none',
            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb';
          }}
        >
          <div className="food-name" style={{
            fontWeight: '500',
            color: '#111827',
            fontSize: '14px',
            lineHeight: '1.4',
            marginBottom: '4px'
          }}>
            {result.item.displayName}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="food-group-badge" style={{
              display: 'inline-block',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '11px',
              fontWeight: '500',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              {result.item.foodGroup}
            </span>
            
            {result.item.keywords.length > 0 && (
              <div className="keywords" style={{
                fontSize: '11px',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                {result.item.keywords.slice(0, 3).join(', ')}
                {result.item.keywords.length > 3 && '...'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}