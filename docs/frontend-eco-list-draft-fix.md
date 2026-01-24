# Frontend Fix: Eco List Panel Draft Cards Layout

## Context
The user reported layout bugs and responsive issues in the "draft cards" of the product list on the home page. The issue appeared as clumping of columns and incorrect visual rendering for draft ECOs.

## Issue Analysis
The root cause was identified as invalid HTML nesting in `frontend/components/EcoListPanel.tsx`.
Specifically, the code was conditionally rendering a `<button>` element (RowWrapper/CardWrapper) when `isDraftEco` was true.
Inside this `<button>`, there were `<div>` elements (grid columns or card sections).
Placing `<div>` inside `<button>` is invalid HTML and causes layout issues (e.g., `display: grid` or block-level styling failing or being overridden by button user-agent styles).

## Implementation
Updated `frontend/components/EcoListPanel.tsx` to:
1. Remove the conditional `CardWrapper` and `RowWrapper` components.
2. Always render a `<div>` as the container.
3. If the item is a draft ECO (`isDraftEco` is true):
   - Add `role="button"` and `tabIndex={0}` for accessibility.
   - Attach the `onClick` handler.
   - Add `onKeyDown` handler to support keyboard activation (Enter/Space).
   - Maintain the existing styling (cursor pointer, hover effects).

## Result
This change fixes the layout collapse by ensuring valid HTML structure, while preserving the interactive "click to start" functionality for draft ECOs.
