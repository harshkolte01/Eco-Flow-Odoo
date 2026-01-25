-- CreateTable
CREATE TABLE "EcoApproverAssignment" (
    "id" SERIAL NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "stageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "approvalCategory" "ApprovalCategory" NOT NULL DEFAULT 'required',
    "ruleId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'rule',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcoApproverAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EcoApproverAssignment_ecoId_stageId_idx" ON "EcoApproverAssignment"("ecoId", "stageId");

-- CreateIndex
CREATE INDEX "EcoApproverAssignment_stageId_idx" ON "EcoApproverAssignment"("stageId");

-- CreateIndex
CREATE INDEX "EcoApproverAssignment_userId_idx" ON "EcoApproverAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EcoApproverAssignment_ecoId_stageId_userId_key" ON "EcoApproverAssignment"("ecoId", "stageId", "userId");

-- AddForeignKey
ALTER TABLE "EcoApproverAssignment" ADD CONSTRAINT "EcoApproverAssignment_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "Eco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoApproverAssignment" ADD CONSTRAINT "EcoApproverAssignment_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "EcoStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoApproverAssignment" ADD CONSTRAINT "EcoApproverAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
