-- Allow multiple polls for the same month.
DROP INDEX IF EXISTS "Poll_month_key";

-- Keep lookups by month efficient.
CREATE INDEX IF NOT EXISTS "Poll_month_idx" ON "Poll"("month");
