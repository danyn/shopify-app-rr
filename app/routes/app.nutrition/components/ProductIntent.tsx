/**
 * ProductIntent component - Opens Shopify product editor
 * @param gid - Product Global ID (gid://shopify/Product/...)
 */
export function ProductIntent({ gid }: { gid: string }) {
  /**
   * Opens the native Shopify product editor
   */
  const handleOpenProductEditor = () => {
    // @ts-ignore - intents.invoke is available at runtime but not in current types
    shopify.intents.invoke('edit:shopify/Product', {
      value: gid
    });
  };

  return (
    <s-button
      tone="neutral"
      onClick={handleOpenProductEditor}
    >
      Edit Product
    </s-button>
  );
}
