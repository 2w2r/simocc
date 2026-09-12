/*
  Warnings:

  - You are about to drop the column `icaoCode` on the `Aircraft` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,registration,operatorId,aircraftTypeId]` on the table `Aircraft` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aircraftTypeId` to the `Aircraft` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AircraftTypeDescription" AS ENUM ('LANDPLANE', 'SEAPLANE', 'AMPHIBIAN', 'HELICOPTER', 'GYROCOPTER', 'TILTROTOR');

-- CreateEnum
CREATE TYPE "AircraftTypeEngineCategory" AS ENUM ('PISTON', 'TURBOPROP_TURBOSHAFT', 'JET', 'ELECTRIC', 'ROCKET');

-- CreateEnum
CREATE TYPE "AircraftTypeWakeTurbulenceCategory" AS ENUM ('L', 'M', 'H', 'J');

-- DropIndex
DROP INDEX "Aircraft_userId_registration_operatorId_icaoCode_key";

-- AlterTable
ALTER TABLE "Aircraft" DROP COLUMN "icaoCode",
ADD COLUMN     "aircraftTypeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AircraftTypeReference" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "icaoCode" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "description" "AircraftTypeDescription",
    "engineCategory" "AircraftTypeEngineCategory",
    "engineCount" TEXT,
    "wakeTurbulenceCategory" "AircraftTypeWakeTurbulenceCategory"[],
    "deprecated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AircraftTypeReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AircraftTypeReference_icaoCode_idx" ON "AircraftTypeReference"("icaoCode");

-- CreateIndex
CREATE UNIQUE INDEX "AircraftTypeReference_manufacturer_model_icaoCode_key" ON "AircraftTypeReference"("manufacturer", "model", "icaoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Aircraft_userId_registration_operatorId_aircraftTypeId_key" ON "Aircraft"("userId", "registration", "operatorId", "aircraftTypeId");

-- AddForeignKey
ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_aircraftTypeId_fkey" FOREIGN KEY ("aircraftTypeId") REFERENCES "AircraftTypeReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AircraftTypeReference" ADD CONSTRAINT "AircraftTypeReference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
