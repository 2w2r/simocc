-- CreateEnum
CREATE TYPE "AircraftStatus" AS ENUM ('ACTIVE', 'STORED', 'RETIRED', 'SCRAPPED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "Aircraft" ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "favourite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fictional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lineNumber" TEXT,
ADD COLUMN     "msn" TEXT,
ADD COLUMN     "status" "AircraftStatus" NOT NULL DEFAULT 'ACTIVE';
