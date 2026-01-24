# Frontend UI Refinements: Enhanced Status Visibility

Updated the product and BoM version tables across the application to provide better visual cues for record status and immutability.

## 1. Visual Status Indicators
Replaced generic gray badges with color-coded indicators:
- **Active:** Emerald green (`bg-emerald-50 text-emerald-700`) representing the current live master data.
- **Archived:** Slate gray (`bg-gray-100 text-gray-500`) representing historical, immutable records.
- **Draft:** Blue (`bg-blue-50 text-blue-700`) representing work-in-progress changes.

## 2. Immutability Cues
- Added a **Lock Icon** (SVG) next to the "Archived" status label.
- This provides a clear visual signal to users that these records cannot be modified and are for historical reference only.

## 3. Improved Reporting Page
The "Product Versions" and "BoM History" tabs in the Reporting page now use the same high-visibility status badges, ensuring a consistent user experience across the dashboard and specialized reporting views.

## 4. Affected Files
- `frontend/app/products/page.tsx`
- `frontend/app/boms/page.tsx`
- `frontend/app/reports/page.tsx`

These refinements improve scannability and help users quickly distinguish between active master data and archived history.
