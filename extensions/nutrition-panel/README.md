# Nutrition Panel Admin Action

A Shopify admin action extension that allows merchants to add and edit nutrition information for products directly from the product details page.

## Features

- **Essential Nutrition Information**: Track key nutrition facts including:
  - Panel name
  - Calories
  - Protein (in grams)
  - Carbohydrates (in grams)

- **User-Friendly Interface**: Simple form with validation
- **Multi-language Support**: Includes English and French translations
- **Metaobject Architecture**: Uses Shopify's metaobject system for structured data
- **Validation**: Client-side validation ensures all values are valid

## Architecture

This extension uses Shopify's **metaobject** pattern:

1. **Metaobject Definition** (`nutrition_panel`): Stores the actual nutrition data
2. **Reference Metafield**: Links the product to its nutrition metaobject via `product.metafields.app.nutrition_panel`

This approach allows:
- Structured, type-safe data storage
- Easy querying via GraphQL
- Shared nutrition data across multiple products (if needed)
- Better admin UI integration

## Installation

This extension is automatically deployed when you deploy your Shopify app. The metaobject and metafield definitions are declared in `shopify.app.toml`.

## Usage

1. Navigate to any product in your Shopify admin
2. Click the **More actions** button (three dots) in the top-right corner
3. Select **Edit Nutrition Information** from the dropdown menu
4. Fill in the nutrition information:
   - **Panel Name**: Descriptive name for this nutrition entry
   - **Calories**: Total calorie count
   - **Protein (g)**: Protein content in grams
   - **Carbs (g)**: Carbohydrate content in grams
5. Click **Save** to store the data

## Data Structure

### Metaobject: `nutrition_panel`

```graphql
type: "$app:nutrition_panel"
fields: {
  name: String          # Panel name
  calories: Integer     # Calorie count
  protein: Decimal      # Protein in grams
  carbs: Decimal        # Carbs in grams
  product_reference: ProductReference  # Auto-linked product
}
```

### Product Metafield

The product has a reference metafield that points to the nutrition metaobject:

```
product.metafields.$app.nutrition_panel -> Metaobject Reference
```

## Technical Details

### Files

- `src/ActionExtension.jsx` - Main extension component with form UI
- `src/utils.js` - GraphQL utilities for metaobject operations
- `locales/en.default.json` - English translations
- `locales/fr.json` - French translations
- `shopify.extension.toml` - Extension configuration

### GraphQL Operations

**Fetching Data:**
```graphql
query Product($id: ID!) {
  product(id: $id) {
    metafield(namespace: "$app", key: "nutrition_panel") {
      reference {
        ... on Metaobject {
          id
          fields { key value }
        }
      }
    }
  }
}
```

**Creating New Metaobject:**
```graphql
mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
  metaobjectCreate(metaobject: $metaobject) {
    metaobject { id handle }
  }
}
```

**Updating Existing Metaobject:**
```graphql
mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
  metaobjectUpdate(id: $id, metaobject: $metaobject) {
    metaobject { id handle }
  }
}
```

### Components Used

This extension uses Shopify's Polaris web components:
- `s-admin-action` - Action modal wrapper
- `s-text-field` - Text input field
- `s-number-field` - Numeric input fields
- `s-button` - Action buttons
- `s-stack` - Layout component
- `s-box` - Spacing and layout

### APIs Used

- **GraphQL Admin API**: Direct access via `fetch("shopify:admin/api/graphql.json")`
- **Extension APIs**: 
  - `shopify.close()` - Closes the modal
  - `shopify.data` - Accesses selected product data
  - `shopify.i18n` - Internationalization support

## Development

To preview and test this extension locally:

```bash
# Start the development server
shopify app dev

# In the Dev Console, click the preview link for the nutrition-panel extension
# Navigate to a product and open the action from the More actions menu
```

## Future Enhancements

You can expand the metaobject definition to include additional nutrition fields:

1. Edit `shopify.app.toml` to add new fields to `[metaobjects.app.nutrition_panel.fields]`
2. Update `src/ActionExtension.jsx` to add UI for the new fields
3. Update `src/utils.js` to include new fields in mutations
4. Add translations to locale files

## Resources

- [Shopify Admin Actions Documentation](https://shopify.dev/docs/apps/build/admin/actions-blocks/build-admin-action)
- [Metaobjects Documentation](https://shopify.dev/docs/apps/build/custom-data/metaobjects)
- [Polaris Web Components](https://shopify.dev/docs/api/admin-extensions/components)
- [Extension APIs](https://shopify.dev/docs/api/admin-extensions/api)
