-- AlterTable
ALTER TABLE "Startup" ADD COLUMN     "marketCountry" TEXT,
ADD COLUMN     "marketRegion" TEXT;

-- CreateTable
CREATE TABLE "PitchDoc" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "aiFilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PitchDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PitchDoc_startupId_kind_key" ON "PitchDoc"("startupId", "kind");

-- AddForeignKey
ALTER TABLE "PitchDoc" ADD CONSTRAINT "PitchDoc_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
