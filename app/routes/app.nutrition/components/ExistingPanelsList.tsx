import { getFieldValue } from "../utils/metaobjectHelpers";
import { AttachToProductButton } from "./AttachToProductButton";
import { ProductIntent } from "./ProductIntent";
import { ThemeEditorPreview } from "./ThemeEditorPreview";

/**
 * Existing panels list component
 * @param instances - Array of metaobject instances
 * @param currentTheme - Current theme object
 */
export function ExistingPanelsList({ instances, currentTheme }: { instances: any[], currentTheme?: any }) {
  return (
    <div>
      <h2>Existing Nutrition Panels ({instances.length})</h2>
      {instances.length === 0 ? (
        <p>No nutrition panels created yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {instances.map((instance: any) => {
            const productRefField = instance.fields.find((f: any) => f.key === "product_reference");
            const productId = productRefField?.value;
            const product = productRefField?.reference;
            const isAttached = !!productId;
            
            return (
              <div
                key={instance.id}
                style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}
              >
                <h3>{getFieldValue(instance.fields, "name")}</h3>
                <div style={{ marginBottom: "10px" }}>
                  <div>Calories: {getFieldValue(instance.fields, "calories")}</div>
                  <div>Protein: {getFieldValue(instance.fields, "protein")}g</div>
                  <div>Carbs: {getFieldValue(instance.fields, "carbs")}g</div>
                </div>

                {isAttached ? (
                  <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f0fdf4", borderRadius: "4px", border: "1px solid #86efac" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ color: "#16a34a", fontWeight: "500" }}>✓ Attached to Product</span>
                        <div style={{ marginTop: "5px", fontSize: "12px", color: "#166534" }}>
                          {product ? (
                            <>
                              <div><strong>{product.title}</strong></div>
                              <div>Handle: {product.handle}</div>
                            </>
                          ) : (
                            <div>Product ID: {productId}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <ProductIntent gid={productId} />
                        <ThemeEditorPreview 
                          instance={instance} 
                          disabled={false} 
                          currentTheme={currentTheme} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <AttachToProductButton metaobjectId={instance.id} />
                    <ThemeEditorPreview 
                      instance={instance} 
                      disabled={true} 
                      currentTheme={currentTheme} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
