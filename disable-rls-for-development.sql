-- ===================================
-- 開発環境用: RLS 一時無効化
-- ===================================
-- 注意: 本番環境では絶対に実行しないでください
-- このSQLはSupabase SQLエディタで実行してください

-- 管理者が操作する主要テーブルのRLSを無効化
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 確認メッセージ
SELECT 'RLS無効化完了: 開発環境用に主要テーブルのRow Level Securityを無効化しました' as message;
