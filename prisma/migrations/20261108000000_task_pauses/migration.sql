-- Days a habit was archived and later restored: [{ "from": "yyyy-MM-dd", "to": "yyyy-MM-dd" }, ...].
-- The habit does not count on those days, so restoring it never rescores the gap.
ALTER TABLE "Task" ADD COLUMN "pauses" JSONB;
