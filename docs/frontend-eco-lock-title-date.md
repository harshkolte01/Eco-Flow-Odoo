# Frontend Fix: Lock Title and Disable Effective Date

## Context
The user questioned why the `Title` and `Effective Date` fields were editable in the ECO creation/editing modal.
1.  **Effective Date**: The UI helper text explicitly states "Auto-populated when ECO is done." Allowing manual edits contradicts this instruction and the intended system behavior.
2.  **Title**: The user expected the Title to be locked in the same way as other structural fields (Product, Type, etc.) once the ECO is saved/created, to prevent renaming of an established draft context.

## Implementation
Updated `frontend/components/EcoCreateModal.tsx`:
1.  **Title**: Changed `disabled` prop to `disableStructuralInputs`.
    -   This means the Title is editable during initial creation (`!isSaved`).
    -   Once saved (or when opening an existing draft), the Title becomes read-only, ensuring the ECO identity remains stable.
2.  **Effective Date**: Changed `disabled` prop to `true`.
    -   This field is now always disabled/read-only.
    -   Added `disabled:text-gray-500` class to ensure it visually appears as a read-only system field.
    -   This aligns perfectly with the "Auto-populated when ECO is done" helper text.

## Result
-   **Title**: Can be set when creating a new ECO. Locked after saving.
-   **Effective Date**: Always locked (read-only), indicating it is a system-managed value.
-   **Draft Changes**: Remain fully editable, allowing the user to focus on the content of the change (BoM/Product details) rather than the ECO metadata.
