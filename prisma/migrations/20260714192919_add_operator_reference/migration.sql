-- CreateTable
CREATE TABLE "OperatorReference" (
    "id" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "icaoCode" TEXT,
    "iataCode" TEXT,
    "name" TEXT NOT NULL,
    "callsign" TEXT,
    "country" TEXT,

    CONSTRAINT "OperatorReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorReference_sourceId_key" ON "OperatorReference"("sourceId");
