-- ===================================
-- カテゴリデータ修正SQL（外部キー対応版）
-- ===================================
-- このSQLはSupabase SQLエディタで実行してください

-- ステップ1: 現在のデータを確認
SELECT id, name, display_order, created_at
FROM categories
ORDER BY display_order;

-- ステップ2: JSONが入っているカテゴリ名を正しい名前に更新
-- display_orderの値に基づいて正しいカテゴリ名を設定

UPDATE categories SET name = '麺類'
WHERE display_order = 0 AND name LIKE '%{"display_order"%';

UPDATE categories SET name = 'ご飯もの'
WHERE display_order = 1 AND name LIKE '%{"display_order"%';

UPDATE categories SET name = '一品料理'
WHERE display_order = 2 AND name LIKE '%{"display_order"%';

UPDATE categories SET name = 'お酒'
WHERE display_order = 3 AND name LIKE '%{"display_order"%';

UPDATE categories SET name = 'ソフトドリンク'
WHERE display_order = 4 AND name LIKE '%{"display_order"%';

UPDATE categories SET name = 'デザート'
WHERE display_order = 5 AND name LIKE '%{"display_order"%';

-- ステップ3: 修正結果を確認
SELECT id, name, display_order
FROM categories
ORDER BY display_order;
