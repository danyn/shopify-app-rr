# Recipe Ingredients Module

A complete, portable module for managing recipe ingredients with nutrition analysis capabilities. This module can be dropped into any React Router application.

## Components Overview

### Top-Level Components

- **AddIngredient.tsx** - Component for adding new ingredients to the recipe
- **IngredientItem.tsx** - Individual ingredient item with editing capabilities and drag-and-drop functionality  
- **IngredientList.tsx** - Sortable list of recipe ingredients with drag-and-drop reordering
- **NutritionSummary.tsx** - Component displaying nutrition totals for the recipe and managing analysis modal
- **NutritionDetailsModal.tsx** - Modal showing detailed nutrition information for individual ingredients

### Context & State
- **MiniSearchContext.tsx** - Context for managing food search functionality
- **state/** - State management for ingredients and local recipe data

### Food Search
- **FoodSearch/** - Reusable components for searching and selecting foods from nutrition database

### Nutrition Analysis Modal
- **NutritionAnalysisModal/** - Complete modal system for analyzing ingredient nutrition

## Component Tree Structure

```
Route (route.tsx)
├── LocalState Provider
├── MiniSearchContext Provider
├── AddIngredient
├── IngredientList
│   └── IngredientItem (multiple, sortable)
└── NutritionSummary
    ├── NutritionAnalysisModal
    │   └── NutritionPanelProvider
    │       └── IngredientNutritionPanel (multiple)
    │           ├── IngredientHeader
    │           ├── FoodSelector
    │           │   └── FoodSearchContainerV2
    │           │       ├── FoodSearchInput
    │           │       └── FoodSearchResults
    │           ├── PortionEditor
    │           ├── SaveButton
    │           └── RemoveButton
    └── NutritionDetailsModal
```

## Key Features

- **Drag & Drop**: Ingredients can be reordered via drag and drop
- **Nutrition Analysis**: Complete nutrition analysis with portion selection
- **Food Search**: MiniSearch-powered food database search
- **Persistent State**: Local state management with optimistic updates
- **Responsive UI**: Works across different screen sizes
- **Accessible**: Keyboard navigation and screen reader support

## Dependencies

- React Router (for navigation and data loading)
- @dnd-kit (for drag and drop functionality)
- @nutrition-data-store/nutrition-lib (nutrition calculations)
- @nutrition-data-store/types (shared TypeScript types)

## Usage

This module is designed to be portable. To use in another React Router app:

1. Copy the entire `ingredients/` folder
2. Ensure dependencies are installed
3. Import and use components as needed
4. Provide required context (LocalState, MiniSearchContext)