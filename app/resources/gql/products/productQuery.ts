import { queryResource } from "../queryResource";

type ProductMetafield = {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
  reference?: {
    id: string;
    handle: string;
    displayName: string;
  };
};

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  metafield?: ProductMetafield | null;
};

type ProductQueryResource = {
  product: ProductNode | null;
};

type ProductQueryInput = {
  id: string;
};

export async function productQuery(input: ProductQueryInput, graphql: any) {
  return await queryResource<ProductQueryResource>({
    on: "product",
    query: PRODUCT_QUERY,
    variables: input,
    mode: "query",
    graphql,
  });
}

/**
 * @description Query a single product by ID with nutrition panel metafield
 * @see https://shopify.dev/docs/api/admin-graphql/2024-07/queries/product
 */
const PRODUCT_QUERY = `#graphql
  query Product($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      metafield(namespace: "app", key: "nutrition_panel") {
        id
        namespace
        key
        value
        type
        reference {
          ... on Metaobject {
            id
            handle
            displayName
          }
        }
      }
    }
  }
`;
