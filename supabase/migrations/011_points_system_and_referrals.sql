-- ポイントシステム整理 & 友達紹介機能

-- 1. user_settingsにreferral_codeカラムを追加
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- 既存ユーザーのreferral_codeを生成（user_idの先頭8文字）
UPDATE user_settings
SET referral_code = LEFT(user_id::text, 8)
WHERE referral_code IS NULL;

-- 2. referralsテーブル作成（紹介履歴）
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Authenticated users can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3. reservationsテーブルにpoints_usedカラムを追加
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS points_used integer NOT NULL DEFAULT 0;

-- 4. インデックス
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_referral_code ON user_settings(referral_code);
