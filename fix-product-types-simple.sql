-- ===================================
-- 商品タイプデータ修正SQL（シンプル版）
-- ===================================

-- JSONパターンで一括更新
UPDATE product_types SET name = '通常'
WHERE name = '{"display_order":0}';

UPDATE product_types SET name = 'テイクアウト'
WHERE name = '{"display_order":1}';

UPDATE product_types SET name = 'デリバリー'
WHERE name = '{"display_order":2}';

UPDATE product_types SET name = 'セット'
WHERE name = '{"display_order":3}';

-- 確認
SELECT id, name, created_at
FROM product_types
ORDER BY created_at;
