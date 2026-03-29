-- ============================================================
-- レビューに user_id カラムを追加 & Storage バケット作成
-- ============================================================

-- reviews テーブルに user_id を追加（auth.users への参照）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- user_id のインデックス
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ============================================================
-- Supabase Storage: review-photos バケット（public）
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 誰でもアップロード可能（認証済みユーザーのみ）
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-photos');

-- 誰でも閲覧可能（public バケット）
CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');

-- 自分のファイルのみ削除可能
CREATE POLICY "Users can delete own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
