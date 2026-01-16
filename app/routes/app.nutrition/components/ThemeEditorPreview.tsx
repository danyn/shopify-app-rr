/**
 * ThemeEditorPreview Component - Renders a button that opens the Shopify theme editor for a specific product
 * 
 * @description Uses direct product handle from metaobject reference data to navigate to theme editor.
 * Enhanced query provides product handle directly, eliminating async lookup patterns.
 * 
 * @see https://shopify.dev/docs/api/app-bridge-library/apis/navigation - App Bridge Navigation API
 * 
 * URL Pattern: shopify://admin/themes/{theme-id}/editor?previewPath=/products/{product-handle}
 * Example: shopify://admin/themes/130148794471/editor?previewPath=/products/banana
 * 
 * @param instance - Metaobject instance with fields
 * @param disabled - Whether the button is disabled
 * @param currentTheme - Current theme object with ID
 */
export function ThemeEditorPreview({ 
  instance,
  disabled, 
  currentTheme 
}: { 
  instance: any;
  disabled: boolean; 
  currentTheme?: any;
}) {
  // Find the product_reference field in the instance
  const productRefField = instance.fields?.find((field: any) => field.key === 'product_reference');
  const productHandle = productRefField?.reference?.handle;

  if (!productHandle || !currentTheme?.id) return null;
  
  // Extract theme ID
  const themeId = currentTheme.id.includes('gid://') ? currentTheme.id.split('/').pop() : currentTheme.id;
  
  // Create direct shopify:// URL using product handle
  const themeEditorUrl = `shopify://admin/themes/${themeId}/editor?previewPath=/products/${productHandle}`;

  return (
    <s-button
      tone="neutral"
      disabled={disabled}
      target="_blank"
      href={themeEditorUrl}
    >
      Theme Editor
    </s-button>
  );
}
