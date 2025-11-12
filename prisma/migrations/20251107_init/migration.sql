-- CreateTable
CREATE TABLE "MarkerMapping" (
    "id" SERIAL NOT NULL,
    "markerId" INTEGER NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkerMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarkerMapping_markerId_key" ON "MarkerMapping"("markerId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkerMapping_qrCodeData_key" ON "MarkerMapping"("qrCodeData");


