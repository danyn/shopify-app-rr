import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, HeadersFunction, Form } from "react-router";
import { authenticate } from "../../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { metaobjectDefinitionCreate } from "../../resources/gql/metaobjects/metaobjectDefinitionCreate";
import { getMetaobjectDefinitionId } from "../../resources/gql/metaobjects/metaobjectDefinitionRead";
import { metaobjectDefinitionDelete } from "../../resources/gql/metaobjects/metaobjectDefinitionDelete";
import { createMetaobject } from "../../resources/gql/metaobjects/metaobjectCreate";
import { getAppUrl } from "../../features/resource-locations/appUrl";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

const METAOBJECT_TYPE = "mdr_page_1";
const APP_METAOBJECT_TYPE = `$app:${METAOBJECT_TYPE}`;
const urlHandle = "mdr-2"
export async function action({request, context}: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const env = context.cloudflare.env as Env;
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "createDefinition") {
    let result;
    
    try {
      result = await metaobjectDefinitionCreate(
        {
          definition: {
            type: APP_METAOBJECT_TYPE,
            name: "Custom Page",
            description: "App-controlled custom pages with online store URLs and SEO",
            
            access: {
              admin: "MERCHANT_READ_WRITE",
              storefront: "PUBLIC_READ"
            },
            capabilities: {
              publishable: {
                enabled: true
              },
              renderable: {
                enabled: true,
                data: {
                  metaTitleKey: "title",
                  metaDescriptionKey: "meta_description"
                }
              },
              onlineStore: {
                enabled: true,
                data: {
                  urlHandle,
                }
              },
              translatable: {
                enabled: true
              }
            },
            fieldDefinitions: [
              { key: "name", name: "Name", type: "single_line_text_field", required: true },
              { key: "title", name: "Page Title (SEO)", type: "single_line_text_field", required: true },
              { key: "meta_description", name: "Meta Description (SEO)", type: "multi_line_text_field" },
              { key: "content", name: "Content", type: "multi_line_text_field" },
              { key: "json_1", name: "JSON Data", type: "json" },
              { key: "featured_image", name: "Featured Image", type: "file_reference" }
            ]
          }
        },
        admin.graphql
      );
    } catch (error) {
      console.error("createDefinition - GraphQL call failed:", error);
      return {
        success: false,
        error: `GraphQL call exception: ${error instanceof Error ? error.message : String(error)}`,
        errorType: "GRAPHQL_EXCEPTION",
        fullError: error
      };
    }

    if (result.hasErrors.signal) {
      console.error("createDefinition - GraphQL returned errors:", result.hasErrors);
      return {
        success: false,
        error: result.hasErrors.userErrors?.[0]?.message || "GraphQL returned errors",
        errorType: "GRAPHQL_USER_ERROR",
        userErrors: result.hasErrors.userErrors,
        fullResult: result.hasErrors
      };
    }

    if (!result.resource?.metaobjectDefinition) {
      console.error("createDefinition - No definition in response:", result);
      return {
        success: false,
        error: "No metaobjectDefinition in response",
        errorType: "MISSING_RESOURCE",
        fullResult: result
      };
    }

    return { 
      success: true, 
      action: "createDefinition", 
      definition: result.resource.metaobjectDefinition 
    };
  }

  if (actionType === "createInstance") {
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const metaDescription = formData.get("meta_description") as string;
    const jsonData = formData.get("json_1") as string;
    const content = formData.get("content") as string;

    // Validate required fields
    if (!name || !title) {
      return { 
        success: false, 
        error: "Name and Title are required fields",
        errorType: "VALIDATION_ERROR" 
      };
    }

    // Validate JSON if provided
    if (jsonData) {
      try {
        JSON.parse(jsonData);
      } catch (jsonError) {
        return { 
          success: false, 
          error: `Invalid JSON format: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
          errorType: "JSON_PARSE_ERROR" 
        };
      }
    }

    const fields: Array<{ key: string; value: string }> = [
      { key: "name", value: name },
      { key: "title", value: title }
    ];

    if (metaDescription) fields.push({ key: "meta_description", value: metaDescription });
    if (content) fields.push({ key: "content", value: content });
    // if (jsonData) fields.push({ key: "json_1", value: jsonData });

    let result;
    
    try {
      result = await createMetaobject(
        {
          type: APP_METAOBJECT_TYPE,
          fields,
          capabilities: {
            publishable: {
              status: "ACTIVE"
            }
          }
        },
        admin.graphql
      );
    } catch (error) {
      console.error("createInstance - GraphQL call failed:", error);
      return {
        success: false,
        error: `GraphQL call exception: ${error instanceof Error ? error.message : String(error)}`,
        errorType: "GRAPHQL_EXCEPTION",
        fullError: error
      };
    }

    if (result.hasErrors.signal) {
      console.error("createInstance - GraphQL returned errors:", result.hasErrors);
      return {
        success: false,
        error: result.hasErrors.userErrors?.[0]?.message || "GraphQL returned errors",
        errorType: "GRAPHQL_USER_ERROR",
        userErrors: result.hasErrors.userErrors,
        fullResult: result.hasErrors
      };
    }

    const metaobject = result.resource?.metaobject;
    if (!metaobject) {
      console.error("createInstance - No metaobject in response:", result);
      return { 
        success: false, 
        error: "No metaobject in response",
        errorType: "MISSING_RESOURCE",
        fullResult: result
      };
    }

    let editorUrl;
    let contentEntriesUrl;
    try {
      const shop = session.shop;
      const appId = env.SHOPIFY_APP_ID || "";
      const appHandle = env.SHOPIFY_APP_HANDLE || "";
      
      if (!appId || !appHandle) {
        console.error("createInstance - Missing env vars:", { appId, appHandle });
        return {
          success: false,
          error: "Missing SHOPIFY_APP_ID or SHOPIFY_APP_HANDLE environment variables",
          errorType: "ENV_VAR_MISSING"
        };
      }

      const urls = getAppUrl({ appId, appHandle });
      editorUrl = urls.metaobjectOnlineStoreEditor({
        shop,
        urlHandle,
        metaobjectType: METAOBJECT_TYPE,
        handle: metaobject.handle
      });
      
      contentEntriesUrl = urls.metaobjectContentEntries(shop, METAOBJECT_TYPE);
    } catch (urlError) {
      console.error("createInstance - URL construction failed:", urlError);
      return {
        success: false,
        error: `Failed to construct editor URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`,
        errorType: "URL_CONSTRUCTION_ERROR",
        metaobject
      };
    }

    return { 
      success: true, 
      action: "createInstance", 
      metaobject, 
      editorUrl,
      contentEntriesUrl
    };
  }

  if (actionType === "deleteDefinition") {
    const definitionId = formData.get("definitionId") as string;
    
    if (!definitionId) {
      return { 
        success: false, 
        error: "Definition ID is required",
        errorType: "VALIDATION_ERROR" 
      };
    }

    let result;
    
    try {
      result = await metaobjectDefinitionDelete(
        definitionId,
        admin.graphql
      );
    } catch (error) {
      console.error("deleteDefinition - GraphQL call failed:", error);
      return {
        success: false,
        error: `GraphQL call exception: ${error instanceof Error ? error.message : String(error)}`,
        errorType: "GRAPHQL_EXCEPTION",
        fullError: error
      };
    }

    if (result.hasErrors.signal) {
      console.error("deleteDefinition - GraphQL returned errors:", result.hasErrors);
      return {
        success: false,
        error: result.hasErrors.userErrors?.[0]?.message || "GraphQL returned errors",
        errorType: "GRAPHQL_USER_ERROR",
        userErrors: result.hasErrors.userErrors,
        fullResult: result.hasErrors
      };
    }

    return { 
      success: true, 
      action: "deleteDefinition", 
      deletedId: result.resource?.deletedId 
    };
  }

  return { 
    success: false, 
    error: `Unknown action type: ${actionType}`,
    errorType: "INVALID_ACTION" 
  };
}

export async function loader ({ request, context }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const definitionResult = await getMetaobjectDefinitionId(APP_METAOBJECT_TYPE, admin.graphql);
   const env = context.cloudflare.env as Env;
  const appId = env.SHOPIFY_APP_ID || "";
  const appHandle = env.SHOPIFY_APP_HANDLE || "";
  const urls = getAppUrl({ appId, appHandle });

  return { 
    shop,
    metaobjectType: METAOBJECT_TYPE,
    definitionErrors: definitionResult.hasErrors,
    definition: definitionResult.resource || null,
    contentEntriesUrl: urls.metaobjectContentEntries(shop, METAOBJECT_TYPE)
  };
}

export default function TestMetaobjectInstance() {
  const lData = useLoaderData<typeof loader>();
  const aData = useActionData<typeof action>();

  return (
    <s-page>
      <div style={{padding: '20px', maxWidth: '900px'}}>
        <div style={{marginBottom: '32px'}}>
          <h1>Test Metaobject Pages</h1>
          <p>Create app-controlled metaobject pages with online store URLs, SEO, and translations.</p>
          <div style={{padding: '12px', background: '#f3f4f6', borderRadius: '8px', marginTop: '16px'}}>
            <p><strong>Shop:</strong> {lData.shop}</p>
            <p style={{marginTop: '4px'}}><strong>Type:</strong> {lData.metaobjectType}</p>
          </div>
        </div>

        {/* Step 1 */}
        <div style={{marginBottom: '24px', padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
          <h2 style={{marginBottom: '12px'}}>Step 1: Create Definition</h2>
          <p style={{marginBottom: '16px', color: '#6b7280'}}>
            Creates a definition with 6 fields, online store capability, SEO, and translations.
          </p>

          {lData.definition?.id ? (
            <div>
              <div style={{padding: '12px', background: '#d1fae5', borderRadius: '6px', marginBottom: '12px'}}>
                ✓ Definition exists: {lData.definition?.name}
                <br />
                <small style={{color: '#059669', fontSize: '0.875rem'}}>ID: {lData.definition?.id}</small>
                <br />
                <a href={lData.contentEntriesUrl} target="_blank" rel="noopener noreferrer" style={{color: '#059669', marginTop: '8px', display: 'inline-block'}}>
                  View in Shopify Admin →
                </a>
              </div>
              <Form method="post">
                <input type="hidden" name="actionType" value="deleteDefinition" />
                <input type="hidden" name="definitionId" value={lData.definition?.id} />
                <s-button type="submit" variant="primary" tone="critical">
                  Delete Definition
                </s-button>
              </Form>
            </div>
          ) : (
            <Form method="post">
              <input type="hidden" name="actionType" value="createDefinition" />
              <s-button type="submit" variant="primary">Create Definition</s-button>
            </Form>
          )}
        </div>

        {/* Step 2 */}
        {lData.definition?.id && (
          <div style={{marginBottom: '24px', padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
            <h2 style={{marginBottom: '12px'}}>Step 2: Create Instance</h2>
            <p style={{marginBottom: '16px', color: '#6b7280'}}>Fill in the fields to create a new page.</p>

            <Form method="post">
              <input type="hidden" name="actionType" value="createInstance" />
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div>
                  <label htmlFor="name" style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>Name (required)</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="My Custom Page"
                    style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                  />
                </div>
                
                <div>
                  <label htmlFor="title" style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>Page Title (SEO, required)</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Amazing Custom Page | My Store"
                    style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                  />
                </div>
                
                <div>
                  <label htmlFor="meta_description" style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>Meta Description</label>
                  <textarea
                    id="meta_description"
                    name="meta_description"
                    placeholder="A brief description for search engines (150-160 chars)"
                    style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label htmlFor="json_1" style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>JSON Data</label>
                  <textarea
                    id="json_1"
                    name="json_1"
                    placeholder='{"key": "value"}'
                    style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'monospace'}}
                    rows={4}
                  />
                </div>
                
                <div>
                  <label htmlFor="content" style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>Content</label>
                  <textarea
                    id="content"
                    name="content"
                    placeholder="Page content here..."
                    style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    rows={6}
                  />
                </div>

                <s-button type="submit" variant="primary">Create Page Instance</s-button>
              </div>
            </Form>
          </div>
        )}

        {/* Results */}
        {aData && (
          <div style={{marginBottom: '24px', padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
            <h2 style={{marginBottom: '12px'}}>Result</h2>
            
            {aData.success ? (
              <div style={{padding: '16px', background: '#d1fae5', borderRadius: '6px'}}>
                <p style={{marginBottom: '12px'}}>✓ {aData.action === "createDefinition" ? "Definition created!" : aData.action === "deleteDefinition" ? "Definition deleted!" : "Instance created!"}</p>
                
                {aData.action === "createInstance" && (
                  <div>
                    <p><strong>Handle:</strong> {aData.metaobject?.handle}</p>
                    <p style={{marginTop: '4px'}}><strong>ID:</strong> {aData.metaobject?.id}</p>
                    
                    <div style={{marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b'}}>
                      <p style={{fontWeight: '500', marginBottom: '8px'}}>⚠️ Important: Template Setup Required</p>
                      <p style={{fontSize: '0.875rem', lineHeight: '1.6'}}>
                        The theme template must be created before this page can be viewed. 
                        Shopify automatically creates the default template when you access the content entries page.
                      </p>
                    </div>

                    <div style={{display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap'}}>
                      <a
                        href={aData.contentEntriesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '10px 16px',
                          background: '#008060',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}
                      >
                        1. View in Content Entries →
                      </a>
                      
                      {aData.editorUrl && (
                        <a
                          href={aData.editorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '10px 16px',
                            background: '#6366f1',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}
                        >
                          2. Open in Theme Editor →
                        </a>
                      )}
                    </div>
                    
                    <details style={{marginTop: '16px'}}>
                      <summary style={{cursor: 'pointer', fontWeight: '500', color: '#6b7280'}}>How Template Setup Works</summary>
                      <ul style={{fontSize: '0.875rem', lineHeight: '1.8', marginTop: '8px', marginLeft: '20px'}}>
                        <li>Shopify creates <code>templates/metaobject/{lData.metaobjectType}.json</code> automatically</li>
                        <li>The template starts empty - you must add sections via the theme editor</li>
                        <li>The first template becomes the default for all entries</li>
                        <li>You can create alternate templates (e.g., <code>{lData.metaobjectType}.alternate.json</code>) for different layouts</li>
                        <li>Assign alternate templates using the onlineStore templateSuffix capability</li>
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            ) : (
              <div style={{padding: '16px', background: '#fee2e2', borderRadius: '6px'}}>
                <div style={{marginBottom: '12px'}}>
                  <strong style={{color: '#dc2626'}}>✗ Error</strong>
                  {aData.errorType && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: '#991b1b',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {aData.errorType}
                    </span>
                  )}
                </div>
                <p style={{color: '#991b1b', marginBottom: '12px'}}>{aData.error}</p>
                
                {aData.userErrors && aData.userErrors.length > 0 && (
                  <div style={{marginTop: '12px'}}>
                    <strong style={{fontSize: '0.875rem'}}>User Errors:</strong>
                    <ul style={{marginTop: '4px', marginLeft: '20px', fontSize: '0.875rem'}}>
                      {aData.userErrors.map((err: any, idx: number) => (
                        <li key={idx}>
                          {err.field && <code style={{background: '#fef2f2', padding: '2px 4px', borderRadius: '2px'}}>{err.field.join('.')}</code>}
                          {err.field && ': '}
                          {err.message}
                          {err.code && <em style={{color: '#6b7280'}}> ({err.code})</em>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <details style={{marginTop: '16px'}}>
              <summary style={{cursor: 'pointer', fontWeight: '500', color: '#6b7280'}}>View Full Response</summary>
              <pre style={{marginTop: '8px', fontSize: '0.875rem', overflow: 'auto', padding: '12px', background: '#f9fafb', borderRadius: '4px'}}>
                {JSON.stringify(aData, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Docs */}
        <div style={{padding: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
          <h3 style={{marginBottom: '12px'}}>Feature Details</h3>
          <ul style={{marginLeft: '20px', lineHeight: '1.8'}}>
            <li><strong>Admin Access:</strong> Merchants can view and edit entries in the Content section</li>
            <li><strong>App-Controlled Type:</strong> Definition is owned by the app (uses <code>$app:</code> prefix)</li>
            <li><strong>Online Store:</strong> Creates URLs like <code>/pages/{urlHandle}/{'{handle}'}</code> (e.g., <code>/pages/mdr-1/{'{handle}'}</code>)</li>
            <li><strong>SEO:</strong> Meta title and description fields for search engine optimization</li>
            <li><strong>Translations:</strong> All fields can be translated for multi-language stores</li>
            <li><strong>Theme Templates:</strong> Auto-generated at <code>templates/metaobject/{lData.metaobjectType}.json</code></li>
            <li><strong>Customization:</strong> Merchants add sections via theme editor</li>
          </ul>
          
          <details style={{marginTop: '16px'}}>
            <summary style={{cursor: 'pointer', fontWeight: '600', color: '#1f2937'}}>Working with Templates & Alternate Templates</summary>
            <div style={{marginTop: '12px', fontSize: '0.875rem', lineHeight: '1.8'}}>
              <h4 style={{fontWeight: '600', marginBottom: '8px'}}>Template Creation Process:</h4>
              <ol style={{marginLeft: '20px', marginBottom: '16px'}}>
                <li>Shopify automatically creates <code>templates/metaobject/{lData.metaobjectType}.json</code> when you first access the content entries page</li>
                <li>The template starts empty - you must add sections via the theme editor</li>
                <li>This becomes the default template for all metaobject entries of this type</li>
              </ol>

              <h4 style={{fontWeight: '600', marginBottom: '8px'}}>Creating Alternate Templates:</h4>
              <ol style={{marginLeft: '20px', marginBottom: '16px'}}>
                <li>In the theme editor, duplicate the default template</li>
                <li>Name it with a suffix: <code>{lData.metaobjectType}.alternate.json</code></li>
                <li>Customize the layout with different sections</li>
              </ol>

              <h4 style={{fontWeight: '600', marginBottom: '8px'}}>Assigning Alternate Templates:</h4>
              <p style={{marginBottom: '8px'}}>Use the <code>metaobjectUpdate</code> mutation to assign an alternate template to a specific instance:</p>
              <pre style={{background: '#1f2937', color: '#e5e7eb', padding: '12px', borderRadius: '6px', overflow: 'auto', fontSize: '0.8125rem'}}>
{`mutation AssignTemplate($id: ID!) {
  metaobjectUpdate(
    id: $id
    metaobject: {
      capabilities: {
        onlineStore: {
          templateSuffix: "alternate"
        }
      }
    }
  ) {
    metaobject {
      id
      handle
      capabilities {
        onlineStore {
          templateSuffix
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}`}
              </pre>
              <p style={{marginTop: '8px', color: '#6b7280'}}>
                The <code>templateSuffix</code> corresponds to the part after the type name in the template filename.
                For example, "alternate" maps to <code>{lData.metaobjectType}.alternate.json</code>
              </p>
            </div>
          </details>
        </div>
      </div>
    </s-page>
  );
}
