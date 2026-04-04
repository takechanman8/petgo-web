-- Migration: Owner approval workflow
-- Adds facility approval status, draft system, and user roles

-- 1. Add status column to facilities table
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

ALTER TABLE facilities
  ADD CONSTRAINT facilities_status_check
  CHECK (status IN ('approved', 'pending', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities (status);

-- 2. Add rejection_reason column to facilities table
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Create facility_drafts table for pending edits
CREATE TABLE IF NOT EXISTS facility_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  draft_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_drafts_owner_id ON facility_drafts (owner_id);
CREATE INDEX IF NOT EXISTS idx_facility_drafts_facility_id ON facility_drafts (facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_drafts_status ON facility_drafts (status);

-- 4. Enable RLS on facility_drafts
ALTER TABLE facility_drafts ENABLE ROW LEVEL SECURITY;

-- Owners can select their own drafts
CREATE POLICY facility_drafts_select_own
  ON facility_drafts FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can insert their own drafts
CREATE POLICY facility_drafts_insert_own
  ON facility_drafts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own drafts
CREATE POLICY facility_drafts_update_own
  ON facility_drafts FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Authenticated users can select all drafts (for admin review)
CREATE POLICY facility_drafts_select_authenticated
  ON facility_drafts FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. Add role column to user_settings table
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_role_check
  CHECK (role IN ('user', 'owner', 'admin'));
