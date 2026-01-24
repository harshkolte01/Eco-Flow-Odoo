# Reporting Page Implementation

## Overview

This document describes the implementation of the Reporting page feature for the ECOFlow system. The reporting page provides a comprehensive view of Engineering Change Orders (ECOs) with the ability to view detailed changes for each ECO.

**Date**: January 25, 2026  
**Feature**: Reporting Page with ECO Changes View

## Requirements

Based on the mockup and requirements:
- Report table displaying ECOs with columns: ECO Title, ECO Type, Product Name, Changes (button)
- Clicking "Changes" button redirects to the detailed comparison view for that ECO
- Search and filter functionality
- Role-based access control (Operations users cannot see ECOs)
- Integration with existing EcoChangesView component

## Implementation Details

### Backend

#### New Module: Reports (`backend/src/modules/reports/`)

**Files Created:**
1. `reports.service.js` - Business logic for generating reports
2. `reports.controller.js` - HTTP request handlers
3. `reports.routes.js` - Route definitions
4. `reports.validation.js` - Validation schemas

**Key Features:**
- `getEcosReport()` service function that:
  - Filters ECOs based on user role (Operations users get empty array)
  - Supports search query (`q` parameter)
  - Supports ECO type filter (`ecoType` parameter: 'product' or 'bom')
  - Supports scope filter (`scope` parameter: 'all' or 'mine')
  - Returns formatted report data with:
    - ECO ID, Title, Type (formatted), Product Name, Has Changes flag, Status

**API Endpoint:**
- `GET /api/reports/ecos`
  - Query parameters:
    - `q` (optional): Search query for ECO titles
    - `ecoType` (optional): Filter by 'product' or 'bom'
    - `scope` (optional): Filter by 'all' or 'mine' (auto-set based on role)
  - Returns: `{ report: ReportItem[] }`
  - Access: Private (requires authentication)

**Integration:**
- Registered in `backend/src/index.js` as `/api/reports` route

### Frontend

#### New Page: Reports (`frontend/app/reports/page.tsx`)

**Features:**
- Protected route (requires authentication)
- Search functionality for ECO titles
- Filter by ECO Type (Product/Bill of Materials)
- Displays report table with ECO data
- Responsive design matching existing UI patterns

**Components:**
- Uses `ReportsTable` component for displaying data
- Integrates with `Header` and `Footer` components
- Uses `ProtectedRoute` for authentication

#### New Component: ReportsTable (`frontend/components/ReportsTable.tsx`)

**Features:**
- Displays report data in a table format
- Columns: ECO Title, ECO Type, Product Name, Changes
- "Changes" button that opens a modal with detailed changes view
- Loading and error states
- Empty state handling

**Integration:**
- Uses existing `EcoChangesView` component to display changes
- Modal overlay for viewing changes without navigation
- Properly handles ECO type detection (product vs bom)

#### Header Navigation Update (`frontend/components/Header.tsx`)

**Changes:**
- Added navigation links for "ECOs" and "Reports"
- Active state highlighting based on current route
- Uses Next.js `useRouter` and `usePathname` hooks
- Maintains existing sidebar toggle functionality

## Data Flow

1. **User navigates to Reports page**
   - Frontend: `/reports` route loads
   - Component: `ReportsPage` mounts

2. **Report data fetching**
   - Frontend calls `GET /api/reports/ecos` with query parameters
   - Backend: `getEcosReportController` handles request
   - Service: `getEcosReport` queries database with filters
   - Returns formatted report data

3. **Displaying report**
   - `ReportsTable` component renders data
   - Shows ECO Title, Type, Product Name, and Changes button

4. **Viewing changes**
   - User clicks "Changes" button
   - Modal opens with `EcoChangesView` component
   - Component fetches draft data from existing ECO endpoints
   - Displays side-by-side comparison

## Role-Based Access

- **Engineering Users**: See only their own ECOs (`scope=mine`)
- **Approver/Admin Users**: See all ECOs (`scope=all`)
- **Operations Users**: Cannot see ECOs (empty array returned)

## Search and Filtering

- **Search**: Filters ECO titles (case-insensitive, partial match)
- **ECO Type Filter**: Filter by 'product' or 'bom'
- **Scope**: Automatically set based on user role

## Integration Points

### Existing Components Used
- `EcoChangesView` - For displaying detailed changes
- `Header` - Navigation and user menu
- `Footer` - Page footer
- `ProtectedRoute` - Authentication guard

### Existing API Endpoints Used
- `GET /api/ecos/:id/draft/product` - For product change details
- `GET /api/ecos/:id/draft/bom` - For BoM change details

## Testing Considerations

1. **Backend Tests:**
   - Verify report data structure
   - Test role-based filtering
   - Test search and filter functionality
   - Verify hasChanges flag accuracy

2. **Frontend Tests:**
   - Verify page loads correctly
   - Test search functionality
   - Test filter dropdown
   - Test Changes button and modal
   - Verify navigation links

3. **Integration Tests:**
   - Verify Changes modal displays correct data
   - Test with different ECO types (product/bom)
   - Test with ECOs that have no changes
   - Verify role-based access restrictions

## Files Modified

### Backend
- `backend/src/index.js` - Added reports routes

### Frontend
- `frontend/components/Header.tsx` - Added navigation links

## Files Created

### Backend
- `backend/src/modules/reports/reports.service.js`
- `backend/src/modules/reports/reports.controller.js`
- `backend/src/modules/reports/reports.routes.js`
- `backend/src/modules/reports/reports.validation.js`

### Frontend
- `frontend/app/reports/page.tsx`
- `frontend/components/ReportsTable.tsx`

## Notes

- The implementation follows existing code patterns and conventions
- No existing features were modified or affected
- The Changes button only appears for ECOs that have changes (hasChanges flag)
- The modal uses the existing `EcoChangesView` component for consistency
- All validation follows the existing validation pattern (not Zod)
- The report respects the same role-based access rules as the ECO list endpoint

## Future Enhancements

Potential future improvements:
1. Additional report types (Product Version History, BoM Change History, etc.)
2. Export functionality (CSV, PDF)
3. Date range filtering
4. Status-based filtering
5. Pagination for large datasets
6. Advanced sorting options
