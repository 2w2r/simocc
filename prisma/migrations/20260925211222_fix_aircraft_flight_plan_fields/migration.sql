-- DropForeignKey
ALTER TABLE "AircraftFlightPlanFields" DROP CONSTRAINT "AircraftFlightPlanFields_aircraftId_fkey";

-- AddForeignKey
ALTER TABLE "AircraftFlightPlanFields" ADD CONSTRAINT "AircraftFlightPlanFields_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
