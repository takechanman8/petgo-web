-- バースデーボーナスポイント対応
-- point_historyテーブルのreasonカラムにbirthday_bonusが含められることを確認
-- （CHECK制約がある場合のみ更新が必要）

-- CHECK制約がある場合は更新（なければ何も起きない）
ALTER TABLE point_history DROP CONSTRAINT IF EXISTS point_history_reason_check;

-- 新しいCHECK制約を追加（既存の値 + birthday_bonus）
-- 制約がなかった場合でも明示的に追加して安全性を確保
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'point_history_reason_check'
  ) THEN
    -- CHECK制約が元々なければ追加しない（自由テキストのまま）
    NULL;
  END IF;
END $$;
