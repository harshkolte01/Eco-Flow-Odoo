# Frontend Feature: Skeleton Loading

## Context
The user requested to replace the simple "Loading..." text animations with a skeleton loading design in the ECO creation modal ("New ECO").

## Implementation
Updated `frontend/components/EcoCreateModal.tsx`:
1.  **Added `Skeleton` Component**: A simple functional component using Tailwind's `animate-pulse` and `bg-gray-200`.
2.  **Replaced Option Loading**:
    -   When `loadingOptions` is true (initial load or fetching dropdown options), the form inputs are replaced with a grid of skeleton bars matching the form layout.
3.  **Replaced Draft Loading**:
    -   When `draftLoading` is true (fetching draft details), the draft section is replaced with a skeleton layout.
    -   If `ecoType` is 'product', it shows a skeleton grid for product fields (inputs, textarea).
    -   If `ecoType` is 'bom', it shows a skeleton layout for Components and Operations tables.

## Result
The modal now provides a smoother, more polished user experience during data fetching, with layout stability preserved by the skeleton placeholders.
