-- CreateTable
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "icaoCode" TEXT NOT NULL,
    "operatorSourceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aircraft_userId_registration_operatorSourceId_icaoCode_key" ON "Aircraft"("userId", "registration", "operatorSourceId", "icaoCode");

-- AddForeignKey
ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_operatorSourceId_fkey" FOREIGN KEY ("operatorSourceId") REFERENCES "OperatorReference"("sourceId") ON DELETE SET NULL ON UPDATE CASCADE;
