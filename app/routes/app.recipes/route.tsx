import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useSubmit } from "react-router";
import { authenticate } from "../../shopify.server";
import { useState } from "react";
import { metaobjectsQuery } from "../../resources/gql/metaobjects/metaobjectsQuery";
import { articlesQuery } from "../../resources/gql/articles/articlesQuery";
import { createMetaobject } from "../../resources/gql/metaobjects/metaobjectCreate";
import { updateMetaobject } from "../../resources/gql/metaobjects/metaobjectUpdate";
import { metafieldsSet } from "../../resources/gql/metafields/metafieldsSet";

const METAOBJECT_TYPE = "$app:recipe";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  // Fetch all recipe instances
  const { resource: metaobjectsData } = await metaobjectsQuery(
    { type: METAOBJECT_TYPE, first: 50 },
    admin.graphql
  );

  const instances = metaobjectsData?.edges?.map(edge => edge.node) || [];

  return { instances };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const body = await request.json() as any;
  const { intent } = body;

  try {
    switch (intent) {
      case "fetchArticle": {
        const { resource: articlesData, hasErrors } = await articlesQuery(
          { first: 1 },
          admin.graphql
        );

        if (hasErrors.signal) {
          return {
            success: false,
            error: "Failed to fetch article",
            errorDetails: hasErrors,
          };
        }

        const article = articlesData?.articles?.edges?.[0]?.node;
        if (!article) {
          return { success: false, error: "No articles found" };
        }

        return { success: true, article };
      }

      case "create": {
        const { title, description, cook_time, articleId } = body;

        const fields = [
          { key: "title", value: title },
          { key: "description", value: description },
          { key: "cook_time", value: String(cook_time) },
        ];

        if (articleId) {
          fields.push({ key: "article_reference", value: articleId });
        }

        const { resource: createData, hasErrors } = await createMetaobject(
          { type: METAOBJECT_TYPE, fields },
          admin.graphql
        );

        if (hasErrors.signal) {
          return {
            success: false,
            error: "Failed to create recipe",
            errorDetails: hasErrors,
          };
        }

        const metaobjectId = createData?.metaobject?.id;

        // If articleId was provided, set the reverse metafield
        if (articleId && metaobjectId) {
          const { hasErrors: metafieldErrors } = await metafieldsSet(
            {
              metafieldsSetInput: [
                {
                  namespace: "app",
                  key: "recipe",
                  type: "metaobject_reference",
                  value: metaobjectId,
                  ownerId: articleId,
                },
              ],
            },
            admin.graphql
          );

          if (metafieldErrors.signal) {
            return {
              success: true,
              metaobjectId,
              warning: "Created metaobject but failed to attach to article",
              errorDetails: metafieldErrors,
            };
          }
        }

        return { success: true, metaobjectId };
      }

      case "update": {
        const { metaobjectId, title, description, cook_time, articleId } = body;

        const fields = [
          { key: "title", value: title },
          { key: "description", value: description },
          { key: "cook_time", value: String(cook_time) },
        ];

        if (articleId) {
          fields.push({ key: "article_reference", value: articleId });
        }

        const { hasErrors } = await updateMetaobject(metaobjectId, fields, admin.graphql);

        if (hasErrors.signal) {
          return {
            success: false,
            error: "Failed to update recipe",
            errorDetails: hasErrors,
          };
        }

        return { success: true };
      }

      case "attach": {
        const { metaobjectId, articleId } = body;

        // First update the metaobject to include the article_reference
        const { hasErrors: updateErrors } = await updateMetaobject(
          metaobjectId,
          [{ key: "article_reference", value: articleId }],
          admin.graphql
        );

        if (updateErrors.signal) {
          return {
            success: false,
            error: "Failed to update metaobject with article reference",
            errorDetails: updateErrors,
          };
        }

        // Then set the reverse metafield on the article
        const { hasErrors: metafieldErrors } = await metafieldsSet(
          {
            metafieldsSetInput: [
              {
                namespace: "app",
                key: "recipe",
                type: "metaobject_reference",
                value: metaobjectId,
                ownerId: articleId,
              },
            ],
          },
          admin.graphql
        );

        if (metafieldErrors.signal) {
          return {
            success: false,
            error: "Failed to set article metafield",
            errorDetails: metafieldErrors,
          };
        }

        return { success: true };
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

// Helper button components using useSubmit
function FetchArticleButton({ onArticleFetched }: { onArticleFetched: (article: any) => void }) {
  const submit = useSubmit();
  const [isPending, setIsPending] = useState(false);

  return (
    <s-button
      onClick={() => {
        setIsPending(true);
        submit({ intent: "fetchArticle" } as Record<string, any>, { method: "post", encType: "application/json" });
      }}
    >
      {isPending ? "Fetching..." : "Select Article"}
    </s-button>
  );
}

function CreateRecipeButton({ 
  title, 
  description, 
  cookTime, 
  articleId 
}: { 
  title: string;
  description: string;
  cookTime: string;
  articleId?: string;
}) {
  const submit = useSubmit();
  const [isPending, setIsPending] = useState(false);

  return (
    <s-button
      variant="primary"
      onClick={() => {
        setIsPending(true);
        submit(
          {
            intent: "create",
            title,
            description,
            cook_time: parseInt(cookTime),
            articleId,
          } as Record<string, any>,
          { method: "post", encType: "application/json" }
        );
      }}
      disabled={!title || !description || !cookTime || isPending}
    >
      {isPending ? "Creating..." : "Create Recipe"}
    </s-button>
  );
}

function AttachToArticleButton({ metaobjectId }: { metaobjectId: string }) {
  const submit = useSubmit();
  const [isPending, setIsPending] = useState(false);

  const handleAttach = () => {
    setIsPending(true);
    submit({ intent: "fetchArticle" } as Record<string, any>, { method: "post", encType: "application/json" });
  };

  return (
    <s-button
      tone="neutral"
      onClick={handleAttach}
      disabled={isPending}
    >
      {isPending ? "Attaching..." : "Attach to Article"}
    </s-button>
  );
}

export default function RecipeManager() {
  const { instances } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const getFieldValue = (fields: any[], key: string) => {
    return fields.find(f => f.key === key)?.value || "";
  };

  const isAttached = (fields: any[]) => {
    const articleRef = fields.find(f => f.key === "article_reference");
    return articleRef?.value;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Recipe Manager</h1>

      <div style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>Create New Recipe</h2>
        
        <div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              style={{ width: "100%", padding: "8px", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Cook Time (minutes):</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FetchArticleButton onArticleFetched={setSelectedArticle} />
            {selectedArticle && (
              <span style={{ color: "green" }}>
                Selected: {selectedArticle.title}
              </span>
            )}
          </div>

          <CreateRecipeButton
            title={title}
            description={description}
            cookTime={cookTime}
            articleId={selectedArticle?.id}
          />
        </div>

        {actionData && (
          <div style={{ marginTop: "15px", padding: "10px", backgroundColor: actionData.success ? "#d4edda" : "#f8d7da", borderRadius: "4px" }}>
            {actionData.success ? "Success!" : `Error: ${actionData.error}`}
            {actionData.warning && <div style={{ marginTop: "5px" }}>⚠️ {actionData.warning}</div>}
          </div>
        )}
      </div>

      <div>
        <h2>Existing Recipes ({instances.length})</h2>
        {instances.length === 0 ? (
          <p>No recipes created yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {instances.map((instance: any) => (
              <div
                key={instance.id}
                style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}
              >
                <h3>{getFieldValue(instance.fields, "title")}</h3>
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    {getFieldValue(instance.fields, "description")}
                  </div>
                  <div>Cook Time: {getFieldValue(instance.fields, "cook_time")} minutes</div>
                </div>
                
                {!isAttached(instance.fields) ? (
                  <AttachToArticleButton metaobjectId={instance.id} />
                ) : (
                  <span style={{ color: "green" }}>✓ Attached to Article</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
