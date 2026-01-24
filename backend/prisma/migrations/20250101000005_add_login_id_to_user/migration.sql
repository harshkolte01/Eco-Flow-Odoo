ALTER TABLE "User" ADD COLUMN "loginId" TEXT;

UPDATE "User"
SET "loginId" = CASE
  WHEN LENGTH(
    REGEXP_REPLACE(
      SUBSTRING("email" FROM 1 FOR POSITION('@' IN "email") - 1),
      '[^a-zA-Z0-9_-]',
      '',
      'g'
    )
  ) >= 6 THEN
    SUBSTRING(
      REGEXP_REPLACE(
        SUBSTRING("email" FROM 1 FOR POSITION('@' IN "email") - 1),
        '[^a-zA-Z0-9_-]',
        '',
        'g'
      )
      FROM 1 FOR 12
    )
  ELSE
    SUBSTRING(
      REGEXP_REPLACE(
        SUBSTRING("email" FROM 1 FOR POSITION('@' IN "email") - 1),
        '[^a-zA-Z0-9_-]',
        '',
        'g'
      ) || '_user'
      FROM 1 FOR 12
    )
END;

WITH duplicates AS (
  SELECT
    id,
    "loginId",
    ROW_NUMBER() OVER (PARTITION BY "loginId" ORDER BY id) AS rn
  FROM "User"
)
UPDATE "User" u
SET "loginId" = LEFT(u."loginId", 12 - LENGTH('_' || TO_HEX(u.id))) || '_' || TO_HEX(u.id)
FROM duplicates d
WHERE u.id = d.id AND d.rn > 1;

ALTER TABLE "User" ALTER COLUMN "loginId" SET NOT NULL;

CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
