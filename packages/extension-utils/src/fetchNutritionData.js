import { makeGraphQLQuery } from "./graphql";

/**
 * Fetch nutrition panel data for a product from its metafield
 * @param {string} productId - The product GID (e.g., "gid://shopify/Product/123")
 * @returns {Promise<Object|null>} Nutrition data object or null if not found
 */
export async function fetchNutritionData(productId) {
  const res = await makeGraphQLQuery(
    `query Product($id: ID!) {
      product(id: $id) {
        metafield(namespace: "$app", key: "nutrition_panel") {
          reference {
            ... on Metaobject {
              id
              handle
              fields {
                key
                value
              }
              image: field(key: "image") {
                reference {
                  ... on MediaImage {
                    id
                    image {
                      url
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { id: productId }
  );

  const metaobject = res?.data?.product?.metafield?.reference;
  if (metaobject) {
    const data = {
      id: metaobject.id,
      handle: metaobject.handle,
    };
    
    // Flatten fields array into data object
    metaobject.fields.forEach((field) => {
      data[field.key] = field.value;
    });

    // Extract image data if present
    const imageRef = metaobject.image?.reference;
    if (imageRef) {
      data.image = imageRef.id;
      data.imageUrl = imageRef.image?.url;
      data.imageWidth = imageRef.image?.width;
      data.imageHeight = imageRef.image?.height;
    }

    return data;
  }

  return null;
}
