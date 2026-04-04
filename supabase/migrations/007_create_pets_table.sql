-- petsテーブル作成
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('犬', '猫')),
  breed text,
  birth_year integer,
  birth_month integer CHECK (birth_month IS NULL OR (birth_month >= 1 AND birth_month <= 12)),
  size text CHECK (size IS NULL OR size IN ('small', 'medium', 'large')),
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);

-- RLSを有効化
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のペットのみ参照可能
CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のペットを作成可能
CREATE POLICY "Users can insert own pets"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のペットを更新可能
CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のペットを削除可能
CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  USING (auth.uid() = user_id);

-- pet-photosストレージバケット作成（既存の場合はスキップ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ストレージポリシー: 認証ユーザーはアップロード可能
CREATE POLICY "Authenticated users can upload pet photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');

-- ストレージポリシー: 誰でも閲覧可能（public bucket）
CREATE POLICY "Anyone can view pet photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');
