-- ============================================================
-- 1. Add reservation_code column to reservations table
-- ============================================================
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_code text UNIQUE;

-- ============================================================
-- 2. Add points_granted flag to reservations table
-- ============================================================
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS points_granted boolean NOT NULL DEFAULT false;

-- Index for deferred points grant query
CREATE INDEX IF NOT EXISTS idx_reservations_points_pending
  ON reservations(check_out_date, status, points_granted)
  WHERE status = 'confirmed' AND points_granted = false;
