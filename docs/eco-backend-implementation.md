# ECO Backend Implementation

## Summary
- Added ECO module endpoints for draft create, update, start, list, and detail responses with stage/product/bom/user data.
- Added dropdown lookup endpoints for active products, active BoMs by product, and lightweight user lookup for ECO form.
- Mounted new routes in the API index and aligned validation with existing middleware patterns.

## Files Touched
- `backend/src/index.js`
- `backend/src/modules/ecos/ecos.controller.js`
- `backend/src/modules/ecos/ecos.routes.js`
- `backend/src/modules/ecos/ecos.service.js`
- `backend/src/modules/ecos/ecos.validation.js`
- `backend/src/modules/products/products.controller.js`
- `backend/src/modules/products/products.routes.js`
- `backend/src/modules/products/products.service.js`
- `backend/src/modules/products/products.validation.js`
- `backend/src/modules/boms/boms.controller.js`
- `backend/src/modules/boms/boms.routes.js`
- `backend/src/modules/boms/boms.service.js`
- `backend/src/modules/boms/boms.validation.js`
- `backend/src/modules/users/users.controller.js`
- `backend/src/modules/users/users.routes.js`
- `backend/src/modules/users/users.service.js`
