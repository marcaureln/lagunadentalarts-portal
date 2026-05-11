-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'COMPLETED', 'ABORTED');

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "externalUploadId" TEXT NOT NULL,
    "backend" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadSession_caseId_status_idx" ON "UploadSession"("caseId", "status");

-- CreateIndex
CREATE INDEX "UploadSession_status_createdAt_idx" ON "UploadSession"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
