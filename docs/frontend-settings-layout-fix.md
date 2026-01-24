# Frontend Settings Layout Fix

## Overview
Addressed issues with duplicate sidebars and responsiveness in the Admin Settings section.

## Changes Implemented

### 1. Layout Restructuring
- **Problem**: `AppShell` (containing the main application sidebar) was being rendered inside `SettingsLayout` (which adds a second sidebar) because individual pages were wrapping themselves in `AppShell`.
- **Fix**: 
  - Moved `AppShell` and `ProtectedRoute` wrappers from individual pages (`EcoStagesPage`, `StageDetailPage`) to the parent `SettingsLayout` (`frontend/app/settings/layout.tsx`).
  - This ensures a single `AppShell` instance wraps the entire Settings section.

### 2. Responsive Design
- Updated `SettingsLayout` to be fully responsive.
- **Desktop**: The Settings Sidebar is displayed side-by-side with the content (`flex-row`, fixed width `w-64`).
- **Mobile**: The Settings Sidebar is stacked above the content (`flex-col`, `w-full`), making it accessible on smaller screens without breaking the layout.

### 3. Navigation Optimization
- Replaced native `<a>` tags with Next.js `<Link>` components in the Settings Sidebar to enable client-side navigation and prevent full page reloads.

## Files Modified
- `frontend/app/settings/layout.tsx`: Main layout refactoring and responsive styles.
- `frontend/app/settings/eco-stages/page.tsx`: Removed redundant `AppShell` and `ProtectedRoute`.
- `frontend/app/settings/eco-stages/[id]/page.tsx`: Removed redundant `AppShell` and `ProtectedRoute`.
