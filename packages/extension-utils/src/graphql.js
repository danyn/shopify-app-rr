/**
 * Make a GraphQL API call to Shopify Admin API
 * @param {string} query - The GraphQL query or mutation
 * @param {Object} variables - Variables for the query
 * @returns {Promise<Object>} GraphQL response
 */
export async function makeGraphQLQuery(query, variables) {
  console.log('makeGraphQLQuery::');
  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    console.error("Network error");
    throw new Error("Failed to fetch data from Shopify API");
  }

  const json = await res.json();
  if (json.errors?.length) {
    console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0].message);
  }
  return json;
}
