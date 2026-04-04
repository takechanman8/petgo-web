-- petsテーブルに獣医記録カラムを追加
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_name text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS microchip_number text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS insurance_company text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS insurance_policy_number text;

-- petsテーブルに書類URL用カラムを追加
ALTER TABLE pets ADD COLUMN IF NOT EXISTS doc_registration_url text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS doc_passport_url text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS doc_rabies_url text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS doc_vaccine_url text;

-- pet-documentsストレージバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-documents', 'pet-documents', true)
ON CONFLICT (id) DO NOTHING;

-- ストレージポリシー: 認証ユーザーはアップロード可能
CREATE POLICY "Authenticated users can upload pet documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-documents' AND auth.role() = 'authenticated');

-- ストレージポリシー: 誰でも閲覧可能（public bucket）
CREATE POLICY "Anyone can view pet documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-documents');
