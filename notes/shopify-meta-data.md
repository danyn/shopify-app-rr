# Shopify App-Owned Metafields & Metaobjects Reference

## Table of Contents
- [Documentation Links](#documentation-links)
- [Namespace Syntax](#namespace-syntax)
- [TOML Configuration & Liquid Usage](#toml-configuration--liquid-usage)
- [GraphQL Mutation Examples](#graphql-mutation-examples)

---

## Documentation Links

- [Theme App Extensions - Reserved Prefixes](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#reserved-prefixes-for-metafields-and-metaobjects)
- [Metafields and Metaobjects Reserved Prefixes Changelog](https://shopify.dev/changelog/metafields-and-metaobjects-reserved-prefixes-now-supported-in-theme-app-extensions)
- [Liquid Metafield Object](https://shopify.dev/docs/api/liquid/objects/metafield)
- [About Metafields](https://shopify.dev/docs/apps/build/metafields)
- [Manage Metafield Definitions](https://shopify.dev/docs/apps/build/metafields/definitions)
- [Manage Metaobject Definitions](https://shopify.dev/docs/apps/build/metaobjects/manage-metaobject-definitions)
- [Product Queries by Metafield with $app Syntax](https://shopify.dev/changelog/support-added-for-app-namespaces-in-product-queries-by-metafield)

---

## Namespace Syntax

| Context | Base `$app` | Sub-namespace `$app:xyz` |
|---------|-------------|--------------------------|
| **TOML** | `app.key` | `app--xyz.key` |
| **GraphQL** | `$app` | `$app:xyz` |
| **Liquid** | `["$app"]` | `["$app:xyz"]` |

**Usage:**
- **`$app`** = Base namespace for your app
- **`$app:xyz`** = Sub-namespace to organize related metafields (`:` becomes `--` in TOML)

---

## TOML Configuration & Liquid Usage

### Base Namespace (`$app`)

**TOML:**
```toml
[product.metafields.app.nutrition_panel]
name = "Nutrition Panel"
type = "metaobject_reference<$app:nutrition_panel>"

[metaobjects.app.nutrition_panel]
name = "Nutrition Panel"
access.admin = "merchant_read_write"
access.storefront = "public_read"

[metaobjects.app.nutrition_panel.fields.name]
name = "Name"
type = "single_line_text_field"

[metaobjects.app.nutrition_panel.fields.calories]
name = "Calories"
type = "number_integer"
```

**Liquid:**
```liquid
{% assign nutrition = product.metafields["$app"].nutrition_panel.value %}


{% if nutrition %}
  <h3>{{ nutrition.name.value }}</h3>
  <div>Calories: {{ nutrition.calories.value }}</div>
{% endif %}
```

### Sub-namespace (`$app:test`)

**TOML:**
```toml
[product.metafields.app--test.boolean]
name = "Test a boolean"
type = "boolean"
```

**Liquid:**
```liquid
{% assign test_boolean = product.metafields["$app:test"].boolean.value %}

{% if test_boolean %}
  <div>Test boolean is true!</div>
{% endif %}
```

---

## GraphQL Mutation Examples


### Setting Metafields

```typescript
await metafieldsSet({
  metafieldsSetInput: [
    {
      namespace: "$app",           // Base namespace
      key: "nutrition_panel",
      type: "metaobject_reference",
      value: metaobjectId,
      ownerId: productId,
    },
    {
      namespace: "$app:test",      // Sub-namespace
      key: "boolean",
      type: "boolean",
      value: "true",
      ownerId: productId,
    },
  ],
}, admin.graphql);
```

### Creating a Metaobject

```typescript
await createMetaobject({ 
  type: "$app:nutrition_panel",
  capabilities: { publishable: { status: "ACTIVE" } },
  fields: [
    { key: "name", value: name },
    { key: "calories", value: String(calories) },
    { key: "protein", value: String(protein) },
    { key: "carbs", value: String(carbs) },
  ]
}, admin.graphql);
```

