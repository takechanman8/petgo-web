-- =============================================
-- facilities に owner_id カラムを追加
-- =============================================
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS owner_id UUID;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON facilities(owner_id);

-- RLS ポリシー：オーナーが自分の施設を管理
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- 全員が施設を閲覧可能
CREATE POLICY "Anyone can view facilities"
  ON facilities FOR SELECT
  USING (true);

-- 認証ユーザーが施設を登録可能
CREATE POLICY "Authenticated users can insert facilities"
  ON facilities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- オーナーが自分の施設を更新可能
CREATE POLICY "Owners can update own facilities"
  ON facilities FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- オーナーが自分の施設を削除可能
CREATE POLICY "Owners can delete own facilities"
  ON facilities FOR DELETE
  USING (auth.uid() = owner_id);

-- =============================================
-- 管理者向け: 自分の施設の予約を閲覧可能
-- =============================================
CREATE POLICY "Owners can view reservations for own facilities"
  ON reservations FOR SELECT
  USING (
    facility_id IN (
      SELECT id FROM facilities WHERE owner_id = auth.uid()
    )
  );

-- 管理者向け: 自分の施設の予約ステータスを更新可能
CREATE POLICY "Owners can update reservations for own facilities"
  ON reservations FOR UPDATE
  USING (
    facility_id IN (
      SELECT id FROM facilities WHERE owner_id = auth.uid()
    )
  );

-- =============================================
-- 管理者向け: 自分の施設のレビューを閲覧可能（既にpublicだが明示的に）
-- =============================================
-- reviews は既に全員閲覧可能なのでポリシー追加不要
