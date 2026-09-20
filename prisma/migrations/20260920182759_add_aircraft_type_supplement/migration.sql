-- CreateTable
CREATE TABLE "AircraftTypeSupplement" (
    "icaoCode" TEXT NOT NULL,
    "aerodromeReferenceCodeNumber" INTEGER,
    "aerodromeReferenceCodeLetter" TEXT,
    "rescueFireFightingCategory" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftTypeSupplement_pkey" PRIMARY KEY ("icaoCode")
);
