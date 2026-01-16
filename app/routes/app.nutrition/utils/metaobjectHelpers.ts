/**
 * Get a field value from metaobject fields array
 * @param fields - Array of metaobject fields
 * @param key - Field key to search for
 * @returns Field value or empty string if not found
 */
export function getFieldValue(fields: any[], key: string): string {
  return fields.find(f => f.key === key)?.value || "";
}

/**
 * Check if a metaobject is attached to a product
 * @param fields - Array of metaobject fields
 * @returns True if product_reference field has a value
 */
export function isAttached(fields: any[]): boolean {
  const productRef = fields.find(f => f.key === "product_reference");
  return !!productRef?.value;
}
