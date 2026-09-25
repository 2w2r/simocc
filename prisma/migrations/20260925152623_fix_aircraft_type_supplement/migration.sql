/*
  Warnings:

  - The primary key for the `AircraftTypeSupplement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,icaoCode]` on the table `AircraftTypeSupplement` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `AircraftTypeSupplement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "AircraftTypeSupplement" DROP CONSTRAINT "AircraftTypeSupplement_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD CONSTRAINT "AircraftTypeSupplement_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "AircraftTypeSupplement_userId_icaoCode_key" ON "AircraftTypeSupplement"("userId", "icaoCode");

-- AddForeignKey
ALTER TABLE "AircraftTypeSupplement" ADD CONSTRAINT "AircraftTypeSupplement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
