import { queryResource } from "../queryResource";

type ProductReference = {
  id: string;
  handle: string;
  title: string;
  nutritionPanelMetafield: {
    id: string;
    value: string;
    type: string;
    reference: {
      id: string;
      handle: string;
      type: string;
    } | null;
  } | null;
};

type MetaobjectFieldWithReference = {
  key: string;
  value: string | null;
  type: string;
  reference: ProductReference | null;
};

type MetaobjectNodeWithReference = {
  id: string;
  handle: string;
  type: string;
  fields: MetaobjectFieldWithReference[];
};

type MetaobjectsWithProductReferenceResource = {
  edges: {
    node: MetaobjectNodeWithReference;
  }[];
};

type MetaobjectsWithProductReferenceInput = {
  type: string;
  first: number;
};

export async function getMetaobjectsWithProductReference(input: MetaobjectsWithProductReferenceInput, graphql: any) {
  return await queryResource<MetaobjectsWithProductReferenceResource>({
    on: "metaobjects",
    query: METAOBJECTS_WITH_PRODUCT_REFERENCE_QUERY,
    variables: input,
    mode: "query",
    graphql,
  });
}

/**
 * @description Query metaobjects by type with product reference data including handles
 * @see https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjects
 */
const METAOBJECTS_WITH_PRODUCT_REFERENCE_QUERY = `#graphql
  query Metaobjects($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      edges {
        node {
          id
          handle
          type
          fields {
            key
            value
            type
            reference {
              ... on Product {
                id
                handle
                title
                nutritionPanelMetafield: metafield(namespace: "$app", key: "nutrition_panel") {
                  id
                  value
                  type
                  reference {
                    ... on Metaobject {
                      id
                      handle
                      type
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * @description Query metaobjects by type with product reference data including handles
 * @see https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjects
 */
const X_METAOBJECTS_WITH_PRODUCT_REFERENCE_QUERY = `#graphql
  query Metaobjects($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      edges {
        node {
          id
          handle
          type
          fields {
            key
            value
            type
            reference {
              ... on Product {
                id
                handle
                title
              }
            }
          }
        }
      }
    }
  }
`;