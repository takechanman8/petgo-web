-- 無効な画像URL（404）を有効なUnsplash URLに差し替え
-- 対象: 十勝ドッグフィールド (photo-1477884213360-7e9d7dcc8f9b → 404)

UPDATE facilities
SET photo_url = 'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=400&h=300&fit=crop'
WHERE id = 'b7000001-0002-4000-a000-000000000002';
