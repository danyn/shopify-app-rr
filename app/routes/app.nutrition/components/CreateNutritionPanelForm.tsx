import { useSubmit, useActionData } from "react-router";
import { useLocalState } from "../state/LocalState";
import type { action } from "../route";

/**
 * Create form component for nutrition panels
 */
export function CreateNutritionPanelForm() {
  const [state, dispatch] = useLocalState();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  /**
   * Handle fetching a product from the store
   */
  const handleFetchProduct = () => {
    dispatch({ type: 'setSubmitting', payload: { isSubmitting: true } });
    submit({ intent: "fetchProduct" } as Record<string, any>, { 
      method: "post", 
      encType: "application/json" 
    });
  };

  /**
   * Handle creating a new nutrition panel
   */
  const handleCreate = () => {
    dispatch({ type: 'setSubmitting', payload: { isSubmitting: true } });
    submit(
      {
        intent: "create",
        name: state.formData.name,
        calories: parseInt(state.formData.calories),
        protein: parseFloat(state.formData.protein),
        carbs: parseFloat(state.formData.carbs),
        productId: state.selectedProduct?.id,
      } as Record<string, any>,
      { method: "post", encType: "application/json" }
    );
  };

  return (
    <s-section heading="Create New Nutrition Panel">
      <s-stack gap="base">
        <s-text-field
          label="Name"
          value={state.formData.name}
          onChange={(e) => dispatch({ type: 'setField', payload: { field: 'name', value: e.currentTarget.value } })}
          required
        />

        <s-number-field
          label="Calories"
          value={state.formData.calories}
          onChange={(e) => dispatch({ type: 'setField', payload: { field: 'calories', value: e.currentTarget.value } })}
          min={0}
          required
        />

        <s-number-field
          label="Protein (g)"
          value={state.formData.protein}
          onChange={(e) => dispatch({ type: 'setField', payload: { field: 'protein', value: e.currentTarget.value } })}
          min={0}
          step={0.1}
          required
        />

        <s-number-field
          label="Carbs (g)"
          value={state.formData.carbs}
          onChange={(e) => dispatch({ type: 'setField', payload: { field: 'carbs', value: e.currentTarget.value } })}
          min={0}
          step={0.1}
          required
        />

        <s-stack direction="inline" gap="base">
          <s-button
            variant="secondary"
            onClick={handleFetchProduct}
            disabled={state.isSubmitting}
            loading={state.isSubmitting && !state.selectedProduct}
          >
            {state.isSubmitting && !state.selectedProduct ? "Fetching..." : "Select Product"}
          </s-button>
          {state.selectedProduct && (
            <s-text tone="success">
              ✓ Selected: {state.selectedProduct.title}
            </s-text>
          )}
        </s-stack>

        <s-button
          variant="primary"
          onClick={handleCreate}
          disabled={!state.formData.name || !state.formData.calories || !state.formData.protein || !state.formData.carbs || state.isSubmitting}
          loading={state.isSubmitting && !actionData?.product}
        >
          {state.isSubmitting && !actionData?.product ? "Creating..." : "Create Nutrition Panel"}
        </s-button>

        {actionData && (
          <s-banner tone={actionData.success ? "success" : "critical"}>
            {actionData.success ? "Success!" : `Error: ${actionData.error}`}
            {actionData.warning && (
              <s-stack gap="small">
                <s-text>⚠️ {actionData.warning}</s-text>
              </s-stack>
            )}
            {actionData.metafieldVerified && (
              <s-stack gap="small">
                <s-text type="strong">✓ Metafield Verified on Product</s-text>
                <s-text>Namespace: {actionData.productMetafield?.namespace}</s-text>
                <s-text>Key: {actionData.productMetafield?.key}</s-text>
                <s-text>Metaobject ID: {actionData.productMetafield?.reference?.id}</s-text>
                <s-text>Display Name: {actionData.productMetafield?.reference?.displayName}</s-text>
              </s-stack>
            )}
          </s-banner>
        )}
      </s-stack>
    </s-section>
  );
}
