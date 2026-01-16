import { useSubmit } from "react-router";
import { useLocalState } from "../state/LocalState";

/**
 * Button component for attaching existing panels to products
 * @param metaobjectId - ID of the metaobject to attach
 */
export function AttachToProductButton({ metaobjectId }: { metaobjectId: string }) {
  const submit = useSubmit();
  const [state, dispatch] = useLocalState();

  /**
   * Handle attaching metaobject to a product
   */
  const handleAttach = () => {
    dispatch({ type: 'setSubmitting', payload: { isSubmitting: true } });
    submit({ intent: "fetchProduct" } as Record<string, any>, { method: "post", encType: "application/json" });
  };

  return (
    <s-button
      tone="neutral"
      onClick={handleAttach}
      disabled={state.isSubmitting}
    >
      {state.isSubmitting ? "Attaching..." : "Attach to Product"}
    </s-button>
  );
}
