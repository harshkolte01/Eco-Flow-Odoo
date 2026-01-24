-- Prisma does not support partial unique indexes or check constraints; use raw SQL.

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVersion_active_unique" ON "ProductVersion"("productId")
WHERE "status" = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS "BomVersion_active_unique" ON "BomVersion"("bomId")
WHERE "status" = 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BomComponent_quantity_check'
  ) THEN
    ALTER TABLE "BomComponent"
    ADD CONSTRAINT "BomComponent_quantity_check" CHECK ("quantity" > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EcoBomComponent_quantity_check'
  ) THEN
    ALTER TABLE "EcoBomComponent"
    ADD CONSTRAINT "EcoBomComponent_quantity_check" CHECK ("quantity" > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BomOperation_timeMinutes_check'
  ) THEN
    ALTER TABLE "BomOperation"
    ADD CONSTRAINT "BomOperation_timeMinutes_check" CHECK ("timeMinutes" > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EcoBomOperation_timeMinutes_check'
  ) THEN
    ALTER TABLE "EcoBomOperation"
    ADD CONSTRAINT "EcoBomOperation_timeMinutes_check" CHECK ("timeMinutes" > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Eco_bom_required_check'
  ) THEN
    ALTER TABLE "Eco"
    ADD CONSTRAINT "Eco_bom_required_check" CHECK ("ecoType" <> 'bom' OR "bomId" IS NOT NULL);
  END IF;
END $$;
