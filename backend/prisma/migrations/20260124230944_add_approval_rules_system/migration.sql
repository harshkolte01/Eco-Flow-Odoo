-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('stage_rule', 'condition_rule');

-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('GT', 'LT', 'EQ', 'GTE', 'LTE', 'IN', 'NOT_IN', 'CONTAINS', 'NOT_CONTAINS');

-- CreateEnum
CREATE TYPE "DelegationStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "RuleAuditAction" AS ENUM ('created', 'updated', 'archived', 'condition_added', 'condition_updated', 'condition_deleted', 'approver_added', 'approver_removed');

-- CreateTable
CREATE TABLE "ApprovalRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "RuleType" NOT NULL DEFAULT 'condition_rule',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "stageIds" INTEGER[],
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleCondition" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "logicalOperator" TEXT NOT NULL DEFAULT 'AND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleApprover" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "approvalCategory" "ApprovalCategory" NOT NULL DEFAULT 'required',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "canDelegate" BOOLEAN NOT NULL DEFAULT true,
    "escalationUserId" INTEGER,
    "escalationThresholdDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleApprover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleAudit" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "action" "RuleAuditAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedById" INTEGER NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApproverDelegation" (
    "id" TEXT NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "DelegationStatus" NOT NULL DEFAULT 'active',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApproverDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleEvaluationLog" (
    "id" TEXT NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "ruleId" TEXT NOT NULL,
    "conditionsMet" BOOLEAN NOT NULL,
    "evaluatedApprovers" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleEvaluationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRule_name_key" ON "ApprovalRule"("name");

-- CreateIndex
CREATE INDEX "ApprovalRule_isActive_priority_idx" ON "ApprovalRule"("isActive", "priority");

-- CreateIndex
CREATE INDEX "ApprovalRule_ruleType_idx" ON "ApprovalRule"("ruleType");

-- CreateIndex
CREATE INDEX "ApprovalRule_isArchived_idx" ON "ApprovalRule"("isArchived");

-- CreateIndex
CREATE INDEX "RuleCondition_ruleId_idx" ON "RuleCondition"("ruleId");

-- CreateIndex
CREATE INDEX "RuleApprover_ruleId_userId_idx" ON "RuleApprover"("ruleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleApprover_ruleId_userId_key" ON "RuleApprover"("ruleId", "userId");

-- CreateIndex
CREATE INDEX "RuleAudit_ruleId_idx" ON "RuleAudit"("ruleId");

-- CreateIndex
CREATE INDEX "RuleAudit_performedAt_idx" ON "RuleAudit"("performedAt");

-- CreateIndex
CREATE INDEX "ApproverDelegation_fromUserId_startDate_endDate_idx" ON "ApproverDelegation"("fromUserId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "ApproverDelegation_toUserId_status_idx" ON "ApproverDelegation"("toUserId", "status");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_ecoId_idx" ON "RuleEvaluationLog"("ecoId");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_ruleId_idx" ON "RuleEvaluationLog"("ruleId");

-- AddForeignKey
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleApprover" ADD CONSTRAINT "RuleApprover_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleApprover" ADD CONSTRAINT "RuleApprover_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleApprover" ADD CONSTRAINT "RuleApprover_escalationUserId_fkey" FOREIGN KEY ("escalationUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAudit" ADD CONSTRAINT "RuleAudit_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAudit" ADD CONSTRAINT "RuleAudit_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproverDelegation" ADD CONSTRAINT "ApproverDelegation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproverDelegation" ADD CONSTRAINT "ApproverDelegation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApproverDelegation" ADD CONSTRAINT "ApproverDelegation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "RuleEvaluationLog_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "Eco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "RuleEvaluationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ApprovalRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
