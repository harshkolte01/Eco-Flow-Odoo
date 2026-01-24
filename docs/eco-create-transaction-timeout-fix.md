# ECO create transaction timeout fix

## Summary
- Reduced work inside the interactive transaction when creating an ECO.
- Fetches full ECO detail outside the transaction to avoid Prisma timeout/closed transaction errors.

## Details
- File updated: `backend/src/modules/ecos/ecos.service.js`.
- `createEco` now creates the ECO with a minimal select (`id` only) inside the transaction, writes the audit log, then loads the full ECO detail with `ecoDetailSelect` after the transaction completes.
- This keeps the transaction short and avoids P2028 errors from long-running queries inside the transaction.
