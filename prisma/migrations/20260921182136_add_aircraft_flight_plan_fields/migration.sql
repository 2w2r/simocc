-- CreateTable
CREATE TABLE "AircraftFlightPlanFields" (
    "aircraftId" TEXT NOT NULL,
    "item10a" TEXT,
    "item10b" TEXT,
    "pbn" TEXT,
    "nav" TEXT,
    "com" TEXT,
    "dat" TEXT,
    "sur" TEXT,
    "sel" TEXT,
    "code" TEXT,
    "per" TEXT,
    "rmk" JSONB,
    "rvr" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftFlightPlanFields_pkey" PRIMARY KEY ("aircraftId")
);

-- AddForeignKey
ALTER TABLE "AircraftFlightPlanFields" ADD CONSTRAINT "AircraftFlightPlanFields_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
