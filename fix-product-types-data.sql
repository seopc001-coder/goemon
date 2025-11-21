-- ===================================
-- 商品タイプデータ修正SQL（外部キー対応版）
-- ===================================
-- このSQLはSupabase SQLエディタで実行してください

-- ステップ1: 現在のデータを確認
SELECT id, name, created_at
FROM product_types
ORDER BY created_at;

-- ステップ2: JSONが入っている商品タイプ名を正しい名前に更新
-- IDに基づいて正しい商品タイプ名を設定

UPDATE product_types SET name = '通常'
WHERE id = '684001ad-ed2c-4cd4-add7-56e87a778c8a';

UPDATE product_types SET name = 'テイクアウト'
WHERE id = 'a3bc5be4-8656-4e34-b36a-32144e875857';

UPDATE product_types SET name = 'デリバリー'
WHERE id = '40828e6e-4ab0-46f4-8186-53dda5511766';

UPDATE product_types SET name = 'セット'
WHERE id = '6bfd1fdc-8d37-422c-8c82-8af0bc13dfe2';

UPDATE product_types SET name = 'ドリンク'
WHERE id = '1482ac11-3b48-4e5e-820d-8c6b82b41bcd';

-- ステップ3: 修正結果を確認
SELECT id, name, created_at
FROM product_types
ORDER BY created_at;
