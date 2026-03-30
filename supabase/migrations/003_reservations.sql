-- =============================================
-- reservations テーブル
-- =============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  pets_info TEXT,
  total_price INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

-- インデックス
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_facility_id ON reservations(facility_id);
CREATE INDEX idx_reservations_stripe_session_id ON reservations(stripe_session_id);

-- =============================================
-- RLS（Row Level Security）
-- =============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーが自分の予約のみSELECT可能
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

-- 認証ユーザーが自分の予約をINSERT可能
CREATE POLICY "Users can insert own reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 認証ユーザーが自分の予約をUPDATE可能（キャンセルなど）
CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
