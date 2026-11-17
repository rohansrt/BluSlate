-- CreateEnum
CREATE TYPE "ScenarioMode" AS ENUM ('SANDBOX', 'ACTUALS_SANDBOX', 'WHAT_IF');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "fromPillar" TEXT NOT NULL,
    "targetPillar" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "targetLogicalId" TEXT,
    "payload" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "geography" TEXT,
    "metricDefinition" TEXT,
    "licence" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceLink" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,

    CONSTRAINT "SourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assumption" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "entityLogicalId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "label" "EvidenceLabel" NOT NULL,
    "confidence" TEXT NOT NULL,
    "sensitivity" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "segmentLogicalId" TEXT NOT NULL,
    "visible" JSONB NOT NULL,
    "hidden" JSONB NOT NULL,
    "seed" INTEGER NOT NULL,
    "promptVersion" TEXT NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "personaId" TEXT,
    "synthetic" BOOLEAN NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "mode" "ScenarioMode" NOT NULL,
    "seed" INTEGER NOT NULL,
    "kernelVersion" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "horizonMonths" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "clock" TIMESTAMP(3) NOT NULL,
    "snapshotId" TEXT NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "isActual" BOOLEAN NOT NULL,
    "metrics" JSONB NOT NULL,
    "ledger" JSONB NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeverChange" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "lever" TEXT NOT NULL,
    "oldValue" JSONB NOT NULL,
    "newValue" JSONB NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeverChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketEvent" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "MarketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "versionMap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "type" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCall" (
    "id" TEXT NOT NULL,
    "startupId" TEXT,
    "task" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "logicalId" TEXT,
    "data" JSONB NOT NULL,
    "evidenceLabel" "EvidenceLabel" NOT NULL,
    "createdBy" "Actor" NOT NULL,
    "reviewState" "EntityStatus" NOT NULL,
    "basedOn" TEXT[],
    "rationale" TEXT,
    "schemaVersion" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaleMark" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "logicalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "causedByLogicalId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaleMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_startupId_targetPillar_status_idx" ON "Proposal"("startupId", "targetPillar", "status");

-- CreateIndex
CREATE INDEX "Assumption_startupId_idx" ON "Assumption"("startupId");

-- CreateIndex
CREATE INDEX "Persona_startupId_idx" ON "Persona"("startupId");

-- CreateIndex
CREATE INDEX "Thread_startupId_idx" ON "Thread"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "Period_scenarioId_index_key" ON "Period"("scenarioId", "index");

-- CreateIndex
CREATE INDEX "AiCall_startupId_createdAt_idx" ON "AiCall"("startupId", "createdAt");

-- CreateIndex
CREATE INDEX "Draft_startupId_pillar_idx" ON "Draft"("startupId", "pillar");

-- CreateIndex
CREATE INDEX "StaleMark_startupId_idx" ON "StaleMark"("startupId");

-- CreateIndex
CREATE INDEX "Dependency_fromLogicalId_idx" ON "Dependency"("fromLogicalId");

-- CreateIndex
CREATE INDEX "Entity_startupId_logicalId_idx" ON "Entity"("startupId", "logicalId");

-- AddForeignKey
ALTER TABLE "SourceLink" ADD CONSTRAINT "SourceLink_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceLink" ADD CONSTRAINT "SourceLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
