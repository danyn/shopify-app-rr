import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import { getMetaobjectsWithProductReference } from "../../resources/gql/metaobjects/metaobjectsWithProductReference";
import { productsQuery } from "../../resources/gql/products/productsQuery";
import { productQuery } from "../../resources/gql/products/productQuery";
import { updateMetaobject } from "../../resources/gql/metaobjects/metaobjectUpdate";
import { metafieldsSet } from "../../resources/gql/metafields/metafieldsSet";
import { LocalState } from "./state/LocalState";
import { NutritionManagerFeature } from "./components/NutritionManagerFeature";
import { METAOBJECT_TYPE, createMetaobjectWithRetry } from "./utils/serverHelpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch all nutrition panel instances with product reference data
  const { resource: nutritionObjects } = await getMetaobjectsWithProductReference(
    { type: METAOBJECT_TYPE, first: 50 },
    admin.graphql
  );

  // Fetch themes to get current theme ID
  const themesResponse = await admin.graphql(`
    #graphql
    query GetThemes {
      themes(first: 250) {
        edges {
          node {
            id
            name
            role
            themeStoreId
          }
        }
      }
    }
  `);

  const themesData = await themesResponse.json();
  const themes = themesData?.data?.themes?.edges?.map((edge: any) => edge.node) || [];
  const currentTheme = themes.find((theme: any) => theme.role === 'MAIN') || themes[0];

  const instances = nutritionObjects?.edges?.map(edge => edge.node) || [];

  return { 
    instances, 
    shop: session.shop,
    themes,
    currentTheme
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const body = await request.json() as any;
  const { intent } = body;

  try {
    switch (intent) {


      case "fetchProduct": {
        const { resource: productsData, hasErrors } = await productsQuery(
          { first: 1 },
          admin.graphql
        );

        if (hasErrors.signal) {
          return {
            success: false,
            error: "Failed to fetch product",
            errorDetails: hasErrors,
          };
        }

        const product = productsData?.edges?.[0]?.node;
        if (!product) {
          return { success: false, error: "No products found" };
        }

        return { success: true, product };
      }

      case "create": {
        const { name, calories, protein, carbs, productId } = body;

        // publishable
        const capabilities = {
            publishable: {
              status: "ACTIVE"
            }
          };

        const fields = [
          { key: "name", value: name },
          { key: "calories", value: String(calories) },
          { key: "protein", value: String(protein) },
          { key: "carbs", value: String(carbs) },
        ];

        if (productId) {
          fields.push({ key: "product_reference", value: productId });
        }

        const { resource: createData, hasErrors, handleInfo } = await createMetaobjectWithRetry(
          { type: METAOBJECT_TYPE, capabilities, fields },
          name, // Use the name field as the title for handle generation
          admin.graphql
        );

        if (hasErrors.signal) {
          console.error("Failed to create nutrition panel:", {
            errorDetails: hasErrors,
            handleInfo,
            formData: { name, calories, protein, carbs, productId }
          });
          return {
            success: false,
            error: "Failed to create nutrition panel",
            errorDetails: hasErrors,
            handleInfo,
          };
        }

        const metaobjectId = createData?.metaobject?.id;

        // If productId was provided, set the metaobject referenced from product.metafield
        if (productId && metaobjectId) {
          const { hasErrors: metafieldErrors, resource: metafieldResource  } = await metafieldsSet(
            {
              metafieldsSetInput: [
                {
                  namespace: "$app",
                  key: "nutrition_panel",
                  type: "metaobject_reference",
                  value: metaobjectId,
                  ownerId: productId,
                },
                {
                  namespace: "$app:test",
                  key: "boolean",
                  type: "boolean",
                  value: "true",
                  ownerId: productId,
                },
              ],
            },
            admin.graphql
          );

          if (metafieldErrors.signal) {
            return {
              success:  true,
              metaobjectId,
              warning: "Created metaobject but failed to attach to product",
              errorDetails: metafieldErrors,
              metafieldResource,
              handleInfo,
            };
          }

          // Verify the metafield was set by querying the product
          const { resource: productData } = await productQuery(
            { id: productId },
            admin.graphql
          );

          const productMetafield = productData?.product?.metafield;

          return { 
            success: true, 
            metaobjectId, 
            productId,
            productMetafield,
            metafieldVerified: !!productMetafield,
            handleInfo
          };
        }

        return { success: true, metaobjectId, productId, handleInfo };
      }

      case "update": {
        const { metaobjectId, name, calories, protein, carbs, productId } = body;

        const fields = [
          { key: "name", value: name },
          { key: "calories", value: String(calories) },
          { key: "protein", value: String(protein) },
          { key: "carbs", value: String(carbs) },
        ];

        if (productId) {
          fields.push({ key: "product_reference", value: productId });
        }

        const { hasErrors } = await updateMetaobject(metaobjectId, fields, admin.graphql);

        if (hasErrors.signal) {
          return {
            success: false,
            error: "Failed to update nutrition panel",
            errorDetails: hasErrors,
          };
        }

        return { success: true };
      }

      case "attach": {
        const { metaobjectId, productId } = body;

        // First update the metaobject to include the product_reference
        const { hasErrors: updateErrors } = await updateMetaobject(
          metaobjectId,
          [{ key: "product_reference", value: productId }],
          admin.graphql
        );

        if (updateErrors.signal) {
          return {
            success: false,
            error: "Failed to update metaobject with product reference",
            errorDetails: updateErrors,
          };
        }

        // Then set the reverse metafield on the product
        const { hasErrors: metafieldErrors, resource } = await metafieldsSet(
          {
            metafieldsSetInput: [
              {
                namespace: "$app",
                key: "nutrition_panel",
                type: "metaobject_reference",
                value: metaobjectId,
                ownerId: productId,
              },
              {
                namespace: "$app:test",
                key: "boolean",
                type: "boolean",
                value: "true",
                ownerId: productId,
              },
            ],
          },
          admin.graphql
        );

        if (metafieldErrors.signal) {
          return {
            success: false,
            error: "Failed to set product metafield",
            errorDetails: metafieldErrors,
          };
        }

        return { success: true, resource };
      }

      default:
        return { success: false, error: "Invalid intent" };
    }
  } catch (error: any) {
    console.error("Action error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

export default function NutritionManager() {
  return (
    <LocalState>
      <NutritionManagerFeature />
    </LocalState>
  );
}