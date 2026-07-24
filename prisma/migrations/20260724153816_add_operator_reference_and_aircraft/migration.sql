-- CreateTable
CREATE TABLE "OperatorReference" (
    "id" TEXT NOT NULL,
    "sourceId" INTEGER,
    "userId" TEXT,
    "icaoCode" TEXT,
    "iataCode" TEXT,
    "name" TEXT NOT NULL,
    "callsign" TEXT,
    "country" TEXT,

    CONSTRAINT "OperatorReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "icaoCode" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorReference_sourceId_key" ON "OperatorReference"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Aircraft_userId_registration_operatorId_icaoCode_key" ON "Aircraft"("userId", "registration", "operatorId", "icaoCode");

-- AddForeignKey
ALTER TABLE "OperatorReference" ADD CONSTRAINT "OperatorReference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "OperatorReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
