import { useEffect } from "preact/hooks";
import { fetchNutritionData } from "@local/extension-utils/fetchNutritionData";
import { useLocalState } from "./state";

/**
 * Load nutrition data for a product, dispatching to LocalState.
 */
export function useNutritionData() {
  const { data } = shopify;
  const dispatch = useLocalState('dispatch');
  const productId = data?.selected?.[0]?.id;
  
  useEffect(() => {
    (async function loadNutritionData() {
      try {
        dispatch({ type: 'setLoading', payload: true });

        if (productId) {
          const existingData = await fetchNutritionData(productId);
          dispatch({ type: 'setNutritionData', payload: existingData });
        } else {
          dispatch({ type: 'setNutritionData', payload: null });
        }
      } catch (err) {
        console.error("Error loading nutrition data:", err);
        dispatch({ type: 'setError', payload: err.message });
      }
    })();
  }, [productId]);
}
