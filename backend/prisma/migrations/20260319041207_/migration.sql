/*
  Warnings:

  - A unique constraint covering the columns `[activityId,campId,date,slot]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Squad" ADD COLUMN     "activityGroupId" TEXT;

-- CreateTable
CREATE TABLE "ActivityGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "campId" TEXT NOT NULL,
    "managerId" TEXT,
    "maxScouts" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_activityId_campId_date_slot_key" ON "Schedule"("activityId", "campId", "date", "slot");

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_activityGroupId_fkey" FOREIGN KEY ("activityGroupId") REFERENCES "ActivityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityGroup" ADD CONSTRAINT "ActivityGroup_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityGroup" ADD CONSTRAINT "ActivityGroup_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
