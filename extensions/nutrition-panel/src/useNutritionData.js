import { useEffect } from "preact/hooks";
import { fetchNutritionData } from "@local/extension-utils/fetchNutritionData";
import { useLocalState } from "./state";

/**
 * Load nutrition data for a product, dispatching to LocalState.
 */
export function useNutritionData() {
  const { data: shopifyUiExtension } = shopify;
  const productId = shopifyUiExtension.selected[0].id
  const dispatch = useLocalState('dispatch');

  useEffect(() => {
    (async function loadNutritionData() {
      try {
        const existingData = await fetchNutritionData(productId);
        console.log({ existingData });
        if (existingData) {
          dispatch({
            type: 'initialData',
            payload: {
              id: existingData.id || null,
              name: existingData.name || "",
              calories: existingData.calories ? parseFloat(existingData.calories) : 0,
              protein: existingData.protein ? parseFloat(existingData.protein) : 0,
              carbs: existingData.carbs ? parseFloat(existingData.carbs) : 0,
              image: existingData.image || "",
              imageUrl: existingData.imageUrl || "",
              imageWidth: existingData.imageWidth || null,
              imageHeight: existingData.imageHeight || null,
            },
          });
        } else {
          dispatch({ type: 'initialData', payload: {} });
        }
      } catch (error) {
        console.error("Error loading nutrition data:", error);
        dispatch({ type: 'initialData', payload: {} });
      }
    })();
  }, [productId]);
}
