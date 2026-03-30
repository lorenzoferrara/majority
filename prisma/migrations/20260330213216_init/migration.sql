-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "month" TEXT NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankedChoice" (
    "id" TEXT NOT NULL,
    "ballotId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "RankedChoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Poll_status_idx" ON "Poll"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_month_key" ON "Poll"("month");

-- CreateIndex
CREATE INDEX "Option_pollId_idx" ON "Option"("pollId");

-- CreateIndex
CREATE INDEX "Ballot_pollId_idx" ON "Ballot"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_pollId_userId_key" ON "Ballot"("pollId", "userId");

-- CreateIndex
CREATE INDEX "RankedChoice_ballotId_idx" ON "RankedChoice"("ballotId");

-- CreateIndex
CREATE INDEX "RankedChoice_optionId_idx" ON "RankedChoice"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "RankedChoice_ballotId_rank_key" ON "RankedChoice"("ballotId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "RankedChoice_ballotId_optionId_key" ON "RankedChoice"("ballotId", "optionId");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankedChoice" ADD CONSTRAINT "RankedChoice_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankedChoice" ADD CONSTRAINT "RankedChoice_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
