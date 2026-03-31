-- Migration: remove DRAFT from PollStatus enum
-- First migrate any existing DRAFT polls to OPEN
UPDATE "Poll" SET "status" = 'OPEN' WHERE "status" = 'DRAFT';

-- Recreate the enum without DRAFT
ALTER TYPE "PollStatus" RENAME TO "PollStatus_old";
CREATE TYPE "PollStatus" AS ENUM ('OPEN', 'CLOSED');

-- Swap the column type
ALTER TABLE "Poll" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Poll" ALTER COLUMN "status" TYPE "PollStatus" USING "status"::text::"PollStatus";
ALTER TABLE "Poll" ALTER COLUMN "status" SET DEFAULT 'OPEN';

DROP TYPE "PollStatus_old";
