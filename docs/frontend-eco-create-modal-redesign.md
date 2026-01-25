# EcoCreateModal Redesign

## Overview
Redesigned the `EcoCreateModal` component to provide a modern, clean, and "super simple" user interface, improving readability and visual hierarchy.

## Visual Changes

### 1. Modal Container
- **Shape**: Updated to `rounded-2xl` for a softer, more modern look.
- **Depth**: Replaced hard borders with a `shadow-2xl` and a subtle `ring-1 ring-gray-900/5` for better depth perception.
- **Background**: Added `bg-gray-900/40` backdrop with blur for better focus.

### 2. Header
- **Spacing**: Increased padding to `px-8 py-6` to let the content breathe.
- **Typography**:
    -   Title: Prominent `text-2xl font-bold tracking-tight`.
    -   Tags: Used `rounded-md bg-emerald-50 text-emerald-700` badges.
- **Actions**:
    -   Buttons updated to `rounded-xl`.
    -   Close button changed to a minimal icon style.

### 3. Form Layout
- **Grid**: Increased gap to `gap-6` for better separation of fields.
- **Inputs**:
    -   Style: `rounded-xl`, `bg-gray-50/50`, `ring-1 ring-gray-200`.
    -   Focus: `focus:bg-white`, `focus:ring-2 focus:ring-emerald-500/20`.
- **Labels**:
    -   Style: `text-xs font-semibold uppercase tracking-wider text-gray-700`.

### 4. Draft Changes Section
- **Separation**: Wrapped in a distinct `rounded-2xl border border-gray-100 bg-gray-50/30` container.
- **Typography**: Headers match the main section but are visually distinct.
- **Empty State**: Added a dashed border container for the "No operations added" state.

## Technical Details
- **File**: `frontend/components/EcoCreateModal.tsx`
- **Logic**: No business logic changes were made; strictly UI/UX improvements.
- **Verification**: `npm run build` passed successfully.
