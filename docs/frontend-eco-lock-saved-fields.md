# Frontend Fix: Disable Structural Fields in Saved Drafts

## Context
The user reported an issue where structural fields (Product, ECO Type, Bill of Materials) were editable in the "New ECO" modal even after the ECO was saved as a draft. Changing these fields after saving causes data inconsistencies because the backend draft data (e.g., `ecoProductChange` or `ecoBomDraft`) is linked to the original product/BoM version.

The user requested that these fields be disabled ("just disabled these things") when the ECO is already saved (`isSaved` state is true), similar to how they might be handled in a more strict "Create ECO" workflow where the context is locked after creation.

## Implementation
Updated `frontend/components/EcoCreateModal.tsx`:
1.  Defined a new `disableStructuralInputs` constant:
    ```typescript
    const disableStructuralInputs = disableInputs || isSaved;
    ```
    This ensures that if the ECO is saved (either by clicking "Save" or by opening an existing draft), these fields are disabled.

2.  Applied `disabled={disableStructuralInputs}` to the following inputs:
    -   **ECO Type** (`<select>`)
    -   **Product** (`<select>`)
    -   **Bill of Materials** (`<select>`)
    -   **User / Raised By** (`<select>`) - Locked for consistency, as changing the raiser of an existing ECO is generally not a draft-level edit.

## Result
When a user opens an existing draft ECO (via "Click to Start") or saves a new ECO, the structural fields (Product, Type, etc.) become disabled. The user can still edit the "Draft Changes" (bottom section), "Title", "Effective Date", and "Version Update" fields, and proceed to "Start" the ECO. This prevents the user from invalidating the draft data by changing the underlying product context.
