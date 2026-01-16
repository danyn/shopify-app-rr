import { queryResource } from "../queryResource";

type ProductNode = {
  id: string;
  title: string;
  handle: string;
};

type ProductsQueryResource = {
    edges: {
      node: ProductNode;
    }[];
};

type ProductsQueryInput = {
  first: number;
};

export async function productsQuery(input: ProductsQueryInput, graphql: any) {
  return await queryResource<ProductsQueryResource>({
    on: "products",
    query: PRODUCTS_QUERY,
    variables: input,
    mode: "query",
    graphql,
  });
}

/**
 * @description Query products with configurable limit
 * @see https://shopify.dev/docs/api/admin-graphql/2024-07/queries/products
 */
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`;
