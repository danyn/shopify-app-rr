import { queryResource } from "../queryResource";

type MetaobjectField = {
  key: string;
  value: string | null;
  type: string;
};

type MetaobjectNode = {
  id: string;
  handle: string;
  type: string;
  fields: MetaobjectField[];
};

type MetaobjectsQueryResource = {
  // metaobjects: {
    edges: {
      node: MetaobjectNode;
    }[];
  // };
};

type MetaobjectsQueryInput = {
  type: string;
  first: number;
};

export async function metaobjectsQuery(input: MetaobjectsQueryInput, graphql: any) {
  return await queryResource<MetaobjectsQueryResource>({
    on: "metaobjects",
    query: METAOBJECTS_QUERY,
    variables: input,
    mode: "query",
    graphql,
  });
}

/**
 * @description Query metaobjects by type with configurable limit
 * @see https://shopify.dev/docs/api/admin-graphql/2024-07/queries/metaobjects
 */
const METAOBJECTS_QUERY = `#graphql
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
          }
        }
      }
    }
  }
`;
