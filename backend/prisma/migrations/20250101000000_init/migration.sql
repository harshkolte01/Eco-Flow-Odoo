-- CreateEnum
CREATE TYPE "ProductVersionStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "BomVersionStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "EcoType" AS ENUM ('product', 'bom');
CREATE TYPE "EcoStatus" AS ENUM ('draft', 'in_progress', 'approved', 'applied');
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "ActivationEntityType" AS ENUM ('product', 'bom');
CREATE TYPE "AuditEntityType" AS ENUM ('product', 'bom', 'eco');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productCode" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVersion" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "attachments" JSONB,
    "status" "ProductVersionStatus" NOT NULL,
    "createdFromEcoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bom" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomVersion" (
    "id" SERIAL NOT NULL,
    "bomId" INTEGER NOT NULL,
    "productVersionId" INTEGER NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "status" "BomVersionStatus" NOT NULL,
    "createdFromEcoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomComponent" (
    "id" SERIAL NOT NULL,
    "bomVersionId" INTEGER NOT NULL,
    "componentProductVersionId" INTEGER NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "BomComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomOperation" (
    "id" SERIAL NOT NULL,
    "bomVersionId" INTEGER NOT NULL,
    "operationName" TEXT NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "workCenter" TEXT,

    CONSTRAINT "BomOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoStage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcoStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eco" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "ecoType" "EcoType" NOT NULL,
    "productId" INTEGER NOT NULL,
    "bomId" INTEGER,
    "raisedById" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "versionUpdate" BOOLEAN NOT NULL DEFAULT true,
    "currentStageId" INTEGER NOT NULL,
    "status" "EcoStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Eco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoApproval" (
    "id" SERIAL NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "stageId" INTEGER NOT NULL,
    "approverId" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "actionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcoApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoProductChange" (
    "id" SERIAL NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "baseProductVersionId" INTEGER NOT NULL,
    "newProductName" TEXT,
    "newSalePrice" DECIMAL(10,2),
    "newCostPrice" DECIMAL(10,2),
    "newAttachments" JSONB,

    CONSTRAINT "EcoProductChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoBomDraft" (
    "id" SERIAL NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "baseBomVersionId" INTEGER NOT NULL,

    CONSTRAINT "EcoBomDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoBomComponent" (
    "id" SERIAL NOT NULL,
    "ecoBomDraftId" INTEGER NOT NULL,
    "componentProductVersionId" INTEGER NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "EcoBomComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoBomOperation" (
    "id" SERIAL NOT NULL,
    "ecoBomDraftId" INTEGER NOT NULL,
    "operationName" TEXT NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "workCenter" TEXT,

    CONSTRAINT "EcoBomOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionActivationLog" (
    "id" SERIAL NOT NULL,
    "ecoId" INTEGER NOT NULL,
    "oldProductVersionId" INTEGER,
    "newProductVersionId" INTEGER,
    "oldBomVersionId" INTEGER,
    "newBomVersionId" INTEGER,
    "entityType" "ActivationEntityType" NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionActivationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedById" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVersion_productId_versionNo_key" ON "ProductVersion"("productId", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Bom_productId_key" ON "Bom"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BomVersion_bomId_versionNo_key" ON "BomVersion"("bomId", "versionNo");

-- CreateIndex
CREATE INDEX "BomComponent_bomVersionId_idx" ON "BomComponent"("bomVersionId");

-- CreateIndex
CREATE INDEX "BomComponent_componentProductVersionId_idx" ON "BomComponent"("componentProductVersionId");

-- CreateIndex
CREATE INDEX "BomOperation_bomVersionId_idx" ON "BomOperation"("bomVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "EcoStage_name_key" ON "EcoStage"("name");

-- CreateIndex
CREATE INDEX "Eco_productId_idx" ON "Eco"("productId");

-- CreateIndex
CREATE INDEX "Eco_bomId_idx" ON "Eco"("bomId");

-- CreateIndex
CREATE INDEX "Eco_raisedById_idx" ON "Eco"("raisedById");

-- CreateIndex
CREATE INDEX "Eco_currentStageId_idx" ON "Eco"("currentStageId");

-- CreateIndex
CREATE INDEX "EcoApproval_ecoId_stageId_idx" ON "EcoApproval"("ecoId", "stageId");

-- CreateIndex
CREATE INDEX "EcoApproval_approverId_idx" ON "EcoApproval"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "EcoProductChange_ecoId_key" ON "EcoProductChange"("ecoId");

-- CreateIndex
CREATE INDEX "EcoProductChange_ecoId_idx" ON "EcoProductChange"("ecoId");

-- CreateIndex
CREATE INDEX "EcoProductChange_baseProductVersionId_idx" ON "EcoProductChange"("baseProductVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "EcoBomDraft_ecoId_key" ON "EcoBomDraft"("ecoId");

-- CreateIndex
CREATE INDEX "EcoBomDraft_ecoId_idx" ON "EcoBomDraft"("ecoId");

-- CreateIndex
CREATE INDEX "EcoBomDraft_baseBomVersionId_idx" ON "EcoBomDraft"("baseBomVersionId");

-- CreateIndex
CREATE INDEX "EcoBomComponent_ecoBomDraftId_idx" ON "EcoBomComponent"("ecoBomDraftId");

-- CreateIndex
CREATE INDEX "EcoBomComponent_componentProductVersionId_idx" ON "EcoBomComponent"("componentProductVersionId");

-- CreateIndex
CREATE INDEX "EcoBomOperation_ecoBomDraftId_idx" ON "EcoBomOperation"("ecoBomDraftId");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog"("performedById");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_createdFromEcoId_fkey" FOREIGN KEY ("createdFromEcoId") REFERENCES "Eco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bom" ADD CONSTRAINT "Bom_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomVersion" ADD CONSTRAINT "BomVersion_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomVersion" ADD CONSTRAINT "BomVersion_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomVersion" ADD CONSTRAINT "BomVersion_createdFromEcoId_fkey" FOREIGN KEY ("createdFromEcoId") REFERENCES "Eco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomComponent" ADD CONSTRAINT "BomComponent_bomVersionId_fkey" FOREIGN KEY ("bomVersionId") REFERENCES "BomVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomComponent" ADD CONSTRAINT "BomComponent_componentProductVersionId_fkey" FOREIGN KEY ("componentProductVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomOperation" ADD CONSTRAINT "BomOperation_bomVersionId_fkey" FOREIGN KEY ("bomVersionId") REFERENCES "BomVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eco" ADD CONSTRAINT "Eco_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eco" ADD CONSTRAINT "Eco_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eco" ADD CONSTRAINT "Eco_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eco" ADD CONSTRAINT "Eco_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "EcoStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoApproval" ADD CONSTRAINT "EcoApproval_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "Eco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoApproval" ADD CONSTRAINT "EcoApproval_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "EcoStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoApproval" ADD CONSTRAINT "EcoApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoProductChange" ADD CONSTRAINT "EcoProductChange_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "Eco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoProductChange" ADD CONSTRAINT "EcoProductChange_baseProductVersionId_fkey" FOREIGN KEY ("baseProductVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoBomDraft" ADD CONSTRAINT "EcoBomDraft_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "Eco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoBomDraft" ADD CONSTRAINT "EcoBomDraft_baseBomVersionId_fkey" FOREIGN KEY ("baseBomVersionId") REFERENCES "BomVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoBomComponent" ADD CONSTRAINT "EcoBomComponent_ecoBomDraftId_fkey" FOREIGN KEY ("ecoBomDraftId") REFERENCES "EcoBomDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoBomComponent" ADD CONSTRAINT "EcoBomComponent_componentProductVersionId_fkey" FOREIGN KEY ("componentProductVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoBomOperation" ADD CONSTRAINT "EcoBomOperation_ecoBomDraftId_fkey" FOREIGN KEY ("ecoBomDraftId") REFERENCES "EcoBomDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionActivationLog" ADD CONSTRAINT "VersionActivationLog_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "Eco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionActivationLog" ADD CONSTRAINT "VersionActivationLog_oldProductVersionId_fkey" FOREIGN KEY ("oldProductVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionActivationLog" ADD CONSTRAINT "VersionActivationLog_newProductVersionId_fkey" FOREIGN KEY ("newProductVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionActivationLog" ADD CONSTRAINT "VersionActivationLog_oldBomVersionId_fkey" FOREIGN KEY ("oldBomVersionId") REFERENCES "BomVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionActivationLog" ADD CONSTRAINT "VersionActivationLog_newBomVersionId_fkey" FOREIGN KEY ("newBomVersionId") REFERENCES "BomVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
