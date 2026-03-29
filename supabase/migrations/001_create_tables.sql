-- ============================================================
-- PetGo テーブル定義
-- ============================================================

-- 既存テーブルがあれば削除（開発用）
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS facilities;

-- ------------------------------------------------------------
-- facilities（施設）
-- ------------------------------------------------------------
CREATE TABLE facilities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('宿泊', 'カフェ', '観光地', 'ドッグラン', 'レストラン')),
  prefecture    text NOT NULL,
  area          text NOT NULL,
  description   text,
  photo_url     text,
  price_range   int,
  pet_friendly_score int NOT NULL DEFAULT 0 CHECK (pet_friendly_score BETWEEN 0 AND 100),
  accepted_dog_sizes text[] NOT NULL DEFAULT '{}',
  cat_ok        boolean NOT NULL DEFAULT false,
  features      text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- reviews（レビュー）
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_name     text NOT NULL,
  pet_type      text NOT NULL,
  pet_breed     text,
  pet_size      text CHECK (pet_size IN ('small', 'medium', 'large')),
  rating        int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  photo_url     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- favorites（お気に入り）
-- ------------------------------------------------------------
CREATE TABLE favorites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  facility_id   uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, facility_id)
);

-- ------------------------------------------------------------
-- インデックス
-- ------------------------------------------------------------
CREATE INDEX idx_reviews_facility_id  ON reviews(facility_id);
CREATE INDEX idx_favorites_user_id    ON favorites(user_id);
CREATE INDEX idx_favorites_facility_id ON favorites(facility_id);

-- ------------------------------------------------------------
-- RLS 無効化（開発用）
-- ------------------------------------------------------------
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews    DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites  DISABLE ROW LEVEL SECURITY;
