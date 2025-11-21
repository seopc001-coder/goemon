-- ===================================
-- product_typesテーブルにdisplay_orderカラムを追加
-- ===================================

-- display_orderカラムを追加
ALTER TABLE product_types
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- 既存データにdisplay_orderを設定（created_atの順序で）
WITH ordered_types AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM product_types
)
UPDATE product_types
SET display_order = ordered_types.new_order
FROM ordered_types
WHERE product_types.id = ordered_types.id;

-- 確認
SELECT id, name, display_order, created_at
FROM product_types
ORDER BY display_order;
