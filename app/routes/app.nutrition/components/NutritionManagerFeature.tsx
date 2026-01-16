import { useEffect } from "react";
import { useLoaderData, useActionData } from "react-router";
import { useLocalState } from "../state/LocalState";
import { CreateNutritionPanelForm } from "./CreateNutritionPanelForm";
import { ExistingPanelsList } from "./ExistingPanelsList";
import type { loader, action } from "../route";

/**
 * NutritionManagerFeature - Main feature component wrapped with state
 */
export function NutritionManagerFeature() {
  const { instances, currentTheme } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const dispatch = useLocalState('dispatch');

  /**
   * Process action data from the server
   * Updates state based on action success/failure
   */
  useEffect(() => {
    if (!actionData) return;

    if (actionData?.success && actionData?.product) {
      // Product fetched successfully
      dispatch({ type: 'setProduct', payload: { product: actionData.product } });
      dispatch({ type: 'setSubmitting', payload: { isSubmitting: false } });
    } else if (actionData?.success && actionData?.metaobjectId) {
      // Metaobject created successfully, reset form
      dispatch({ type: 'resetForm' });
    } else if (actionData && !actionData.success) {
      // Error occurred
      dispatch({ type: 'setSubmitting', payload: { isSubmitting: false } });
    }
  }, [actionData, dispatch]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Nutrition Panel Manager</h1>
      <CreateNutritionPanelForm />
      <ExistingPanelsList instances={instances} currentTheme={currentTheme} />
    </div>
  );
}
