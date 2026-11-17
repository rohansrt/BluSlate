-- CreateTable
CREATE TABLE "PillarWorkspace" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "published" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillarWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PillarWorkspace_startupId_pillar_key" ON "PillarWorkspace"("startupId", "pillar");

-- AddForeignKey
ALTER TABLE "PillarWorkspace" ADD CONSTRAINT "PillarWorkspace_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
