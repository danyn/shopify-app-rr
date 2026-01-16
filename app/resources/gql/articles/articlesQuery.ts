import { queryResource } from "../queryResource";

type ArticleNode = {
  id: string;
  title: string;
  handle: string;
};

type ArticlesQueryResource = {
  articles: {
    edges: {
      node: ArticleNode;
    }[];
  };
};

type ArticlesQueryInput = {
  first: number;
};

export async function articlesQuery(input: ArticlesQueryInput, graphql: any) {
  return await queryResource<ArticlesQueryResource>({
    on: "articles",
    query: ARTICLES_QUERY,
    variables: input,
    mode: "query",
    graphql,
  });
}

/**
 * @description Query articles from all blogs with configurable limit
 * @see https://shopify.dev/docs/api/admin-graphql/2024-07/queries/articles
 */
const ARTICLES_QUERY = `#graphql
  query Articles($first: Int!) {
    articles(first: $first) {
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
