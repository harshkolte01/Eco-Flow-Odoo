-- Prisma does not support partial unique indexes or check constraints; use raw SQL.

CREATE UNIQUE INDEX "ProductVersion_active_unique" ON "ProductVersion"("productId")
WHERE "status" = 'active';

CREATE UNIQUE INDEX "BomVersion_active_unique" ON "BomVersion"("bomId")
WHERE "status" = 'active';

ALTER TABLE "BomComponent"
ADD CONSTRAINT "BomComponent_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "EcoBomComponent"
ADD CONSTRAINT "EcoBomComponent_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "BomOperation"
ADD CONSTRAINT "BomOperation_timeMinutes_check" CHECK ("timeMinutes" > 0);

ALTER TABLE "EcoBomOperation"
ADD CONSTRAINT "EcoBomOperation_timeMinutes_check" CHECK ("timeMinutes" > 0);
