-- ============================================================
-- user_id カラム追加 + RLS ポリシー + Storage バケット & ポリシー
-- ============================================================

-- ------------------------------------------------------------
-- 1. reviews テーブルに user_id カラムを追加
-- ------------------------------------------------------------
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ------------------------------------------------------------
-- 2. reviews テーブル: RLS 有効化 & ポリシー
-- ------------------------------------------------------------
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

CREATE POLICY "Anyone can read reviews"
ON reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 3. facilities テーブル: RLS 有効化 & ポリシー
-- ------------------------------------------------------------
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read facilities" ON facilities;

CREATE POLICY "Anyone can read facilities"
ON facilities FOR SELECT
TO public
USING (true);

-- ------------------------------------------------------------
-- 4. favorites テーブル: RLS 有効化 & ポリシー
-- ------------------------------------------------------------
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

CREATE POLICY "Users can read own favorites"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Storage: review-photos バケット & ポリシー
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload review photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view review photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own review photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');

CREATE POLICY "Users can delete own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
