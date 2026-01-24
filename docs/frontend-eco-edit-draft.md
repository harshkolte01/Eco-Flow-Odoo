# Frontend Feature: Edit and Start Draft ECOs

## Context
The user requested to change the behavior when clicking "Click to Start" on a draft ECO in the home page list. Instead of a simple confirmation dialog, it should open the full ECO editing modal (same as "New ECO"), allowing the user to review and edit all fields before starting the ECO.

## Implementation

### 1. `EcoCreateModal.tsx` Updates
- Added optional `initialEcoId` prop to `EcoCreateModal`.
- Updated initialization logic:
  - If `initialEcoId` is provided, `ecoId` state is initialized with it.
  - Added a new `useEffect` to fetch the full ECO details (`/api/ecos/${initialEcoId}`) and populate the form fields (`title`, `ecoType`, `productId`, `bomId`, etc.).
  - The existing draft loading logic (which depends on `ecoId`) automatically fetches the draft changes once the form is populated.
- Updated `resetForm` to respect `initialEcoId`.

### 2. `page.tsx` Updates
- Replaced the simple confirmation modal state (`startConfirmEco`, etc.) with `editingEcoId` state.
- Changed `handleStartEco` / `openStartConfirm` logic to `handleEditDraft`.
- `handleEditDraft` now sets `editingEcoId` and opens `EcoCreateModal`.
- Passed `initialEcoId={editingEcoId}` to `EcoCreateModal`.
- Removed the old "Start this ECO?" confirmation dialog code.

## Result
Clicking "Click to Start" on a draft ECO now opens the comprehensive "New ECO" modal populated with the draft's data. Users can edit the title, product, type, and draft changes (prices, attachments, BoM components/operations) before clicking "Start" within the modal to transition the ECO to "In Progress".
