import { useCallback } from "preact/hooks";
import { useLocalState } from "./state";

/**
 * @note fetch is automatically authenticated and the path is resolved against your app's URL
 * @see https://shopify.dev/docs/apps/build/admin/actions-blocks/connect-app-backend
 * @returns async function for calling fetch routes/api and handling state client side
 */
export function useCallApiRouteGet() {
  const { data } = shopify;
  const productId = data.selected[0].id;
  return useCallback(async () => {

    // setLoadingXYZ(true);
    
    const res = await fetch(
      `api/ui-extension?productId=${productId}`,
    );
    // setLoadingXYZ(false);

    if (!res.ok) {
      console.error("Network error");
    }
    const json = await res.json();
    console.log({ json });
    // if (json?.productIssue) {
      // setXYZ(json?.XYZ);
    // }
  }, [productId]);
}

/**
 * 
 * @returns async function for calling fetch and json in a post to routes/api and handling state client side
 */
export function useCallApiRoutePost() {
  const { data } = shopify;
  const productId = data.selected[0].id;
  const state = useLocalState('state');

  const imageUrl = state.ImageUpload.imageUrl
  const payload = {
    imageUrl,
    foo: 'bar'
  }
  return useCallback(async () => {
    // setLoadingXYZ(true);

    const res = await fetch("api/ui-extension", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    // setLoadingXYZ(false);

    if (!res.ok) {
      console.error(`Error: ${res.status}`);
    }
    const json = await res.json();
    console.log({ json });
    // if (json?.XYZ) {
      // setXYZ(json?.XYZ);
    // }
  }, [productId, imageUrl]);
} 