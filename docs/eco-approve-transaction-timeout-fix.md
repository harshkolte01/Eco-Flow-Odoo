# ECO approve transaction timeout fix

## Summary
- Shortened the approve ECO transaction to avoid Prisma P2028 "transaction not found" errors.

## Details
- File updated: `backend/src/modules/ecos/ecos.service.js`.
- `approveEco` now updates the ECO with a minimal select (`id`) inside the transaction, logs approval, and fetches full detail after the transaction completes.
- This keeps the interactive transaction short and prevents expired/closed transaction errors during approval.
