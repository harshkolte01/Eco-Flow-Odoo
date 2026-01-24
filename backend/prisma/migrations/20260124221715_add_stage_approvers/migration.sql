-- CreateEnum
CREATE TYPE "ApprovalCategory" AS ENUM ('required', 'optional');

-- CreateTable
CREATE TABLE "StageApprover" (
    "id" SERIAL NOT NULL,
    "stageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "approvalCategory" "ApprovalCategory" NOT NULL DEFAULT 'required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageApprover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StageApprover_stageId_idx" ON "StageApprover"("stageId");

-- CreateIndex
CREATE INDEX "StageApprover_userId_idx" ON "StageApprover"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StageApprover_stageId_userId_key" ON "StageApprover"("stageId", "userId");

-- AddForeignKey
ALTER TABLE "StageApprover" ADD CONSTRAINT "StageApprover_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "EcoStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageApprover" ADD CONSTRAINT "StageApprover_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
