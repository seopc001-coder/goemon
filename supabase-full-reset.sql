-- ===================================
-- 五右衛門 ECサイト - 完全版データベース再構築SQL
-- ===================================
-- 【重要】このSQLは既存テーブルを削除して再作成します
-- 実行前に必ずバックアップを取ってください

-- ===================================
-- STEP 1: 既存テーブルの削除（逆順で削除）
-- ===================================

-- 依存関係のあるテーブルから順に削除
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS coupon_usages CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS shipping_addresses CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS hero_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_types CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS stock_history CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;

-- トリガー関数も削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ===================================
-- STEP 2: トリガー関数の作成
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================
-- STEP 3: テーブル作成
-- ===================================

-- 1. カテゴリーテーブル
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 商品タイプテーブル
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 商品テーブル
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    category TEXT NOT NULL,
    product_type TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    image TEXT,
    image2 TEXT,
    image3 TEXT,
    image4 TEXT,
    show_in_ranking BOOLEAN DEFAULT FALSE,
    ranking_position INTEGER,
    is_published BOOLEAN DEFAULT TRUE,
    sold_out_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ヒーロー画像テーブル
CREATE TABLE hero_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. ユーザープロファイルテーブル
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    family_name TEXT,
    given_name TEXT,
    family_name_kana TEXT,
    given_name_kana TEXT,
    phone TEXT,
    postal_code TEXT,
    prefecture TEXT,
    city TEXT,
    address1 TEXT,
    address2 TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. 配送先住所テーブル
CREATE TABLE shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    address_name TEXT,
    family_name TEXT NOT NULL,
    given_name TEXT NOT NULL,
    family_name_kana TEXT,
    given_name_kana TEXT,
    postal_code TEXT NOT NULL,
    prefecture TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    building TEXT,
    phone TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. カートテーブル
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    color TEXT,
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, product_id, color, size)
);

-- 8. お気に入りテーブル
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 9. 注文テーブル
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',

    -- 購入者情報
    purchaser_family_name TEXT NOT NULL,
    purchaser_given_name TEXT NOT NULL,
    purchaser_family_name_kana TEXT NOT NULL,
    purchaser_given_name_kana TEXT NOT NULL,
    purchaser_phone TEXT NOT NULL,
    purchaser_email TEXT NOT NULL,

    -- 配送先情報
    shipping_family_name TEXT NOT NULL,
    shipping_given_name TEXT NOT NULL,
    shipping_family_name_kana TEXT NOT NULL,
    shipping_given_name_kana TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_prefecture TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_address1 TEXT NOT NULL,
    shipping_address2 TEXT,

    -- 支払い情報
    payment_method TEXT NOT NULL,

    -- 金額情報
    subtotal INTEGER NOT NULL DEFAULT 0,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    tax INTEGER NOT NULL DEFAULT 0,
    discount INTEGER DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,

    -- クーポン情報
    coupon_code TEXT,

    -- 配送情報
    delivery_date TEXT,
    delivery_time TEXT,

    -- その他
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. 注文明細テーブル
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT NOT NULL,
    product_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    color TEXT,
    size TEXT,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. クーポンテーブル
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL,
    discount_value INTEGER NOT NULL,
    min_purchase_amount INTEGER DEFAULT 0,
    max_discount_amount INTEGER,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. クーポン使用履歴テーブル
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. 商品レビューテーブル
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. レビュー参考度投票テーブル
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(review_id, user_id)
);

-- 15. サイト設定テーブル
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type TEXT DEFAULT 'string',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. 管理者アクティビティログテーブル
CREATE TABLE admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 17. 通知テーブル
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 18. メールテンプレートテーブル
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 19. 在庫履歴テーブル
CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    reason TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 20. 配送方法テーブル
CREATE TABLE shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_fee INTEGER NOT NULL DEFAULT 0,
    free_shipping_threshold INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===================================
-- STEP 4: インデックス作成
-- ===================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_published ON products(is_published);
CREATE INDEX idx_products_ranking ON products(show_in_ranking, ranking_position);
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX idx_admin_activity_logs_user_id ON admin_activity_logs(user_id);
CREATE INDEX idx_admin_activity_logs_target ON admin_activity_logs(target_type, target_id);

-- ===================================
-- STEP 5: 更新トリガー設定
-- ===================================
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hero_images_updated_at BEFORE UPDATE ON hero_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_methods_updated_at BEFORE UPDATE ON shipping_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- STEP 6: RLSポリシー設定
-- ===================================

-- カテゴリー
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);

-- 商品タイプ
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_types_select_all" ON product_types FOR SELECT USING (true);

-- 商品
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_published" ON products FOR SELECT USING (is_published = true);

-- ヒーロー画像
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_images_select_active" ON hero_images FOR SELECT USING (is_active = true);

-- ユーザープロファイル
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- 配送先住所
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipping_addresses_select_own" ON shipping_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shipping_addresses_insert_own" ON shipping_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shipping_addresses_update_own" ON shipping_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shipping_addresses_delete_own" ON shipping_addresses FOR DELETE USING (auth.uid() = user_id);

-- カート
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carts_select_own" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "carts_insert_own" ON carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_update_own" ON carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "carts_delete_own" ON carts FOR DELETE USING (auth.uid() = user_id);

-- お気に入り
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 注文
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 注文明細
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- クーポン
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_select_active" ON coupons FOR SELECT
USING (is_active = true AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW()));

-- クーポン使用履歴
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_usages_select_own" ON coupon_usages FOR SELECT USING (auth.uid() = user_id);

-- 商品レビュー
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_reviews_select_published" ON product_reviews FOR SELECT USING (is_published = true);
CREATE POLICY "product_reviews_insert_own" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "product_reviews_update_own" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "product_reviews_delete_own" ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- レビュー参考度投票
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_helpful_votes_select_all" ON review_helpful_votes FOR SELECT USING (true);
CREATE POLICY "review_helpful_votes_insert_own" ON review_helpful_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_helpful_votes_delete_own" ON review_helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- サイト設定
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_select_all" ON site_settings FOR SELECT USING (true);

-- 管理者ログ
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- 通知
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- メールテンプレート
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_select_all" ON email_templates FOR SELECT USING (true);

-- 在庫履歴
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_history_select_all" ON stock_history FOR SELECT USING (true);

-- 配送方法
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipping_methods_select_active" ON shipping_methods FOR SELECT USING (is_active = true);

-- ===================================
-- STEP 7: 初期データ投入
-- ===================================

-- カテゴリー初期データ
INSERT INTO categories (name, display_order) VALUES
('焼き菓子', 1),
('ケーキ', 2),
('季節限定', 3),
('その他', 4);

-- 商品タイプ初期データ
INSERT INTO product_types (name, display_order) VALUES
('クッキー', 1),
('タルト', 2),
('シュークリーム', 3),
('チーズケーキ', 4),
('チョコレート', 5),
('その他', 6);

-- サイト設定初期データ
INSERT INTO site_settings (key, value, description, data_type) VALUES
('tax_rate', '10', '消費税率（%）', 'number'),
('free_shipping_threshold', '5000', '送料無料になる購入金額', 'number'),
('default_shipping_fee', '800', '基本送料', 'number'),
('site_maintenance_mode', 'false', 'メンテナンスモード', 'boolean'),
('points_per_100_yen', '1', '100円ごとに付与するポイント数', 'number');

-- 配送方法初期データ
INSERT INTO shipping_methods (name, description, base_fee, free_shipping_threshold, display_order) VALUES
('通常配送', '通常の宅配便での配送', 800, 5000, 1),
('速達配送', '速達での配送（翌日配達）', 1200, NULL, 2);

-- メールテンプレート初期データ
INSERT INTO email_templates (template_key, subject, body, variables) VALUES
('order_confirmation', '【五右衛門】ご注文ありがとうございます', 'この度はご注文いただき、誠にありがとうございます。

注文番号: {{order_number}}
合計金額: ¥{{total}}

ご注文内容の詳細はマイページよりご確認いただけます。', '{"order_number": "注文番号", "total": "合計金額", "customer_name": "お客様名"}'),
('shipping_notification', '【五右衛門】商品を発送いたしました', 'ご注文いただいた商品を発送いたしました。

注文番号: {{order_number}}
配送業者: {{shipping_company}}
お問い合わせ番号: {{tracking_number}}', '{"order_number": "注文番号", "shipping_company": "配送業者", "tracking_number": "お問い合わせ番号"}');

-- ===================================
-- 完了
-- ===================================
-- 実行完了後、以下を確認してください:
-- 1. Table Editorで全20テーブルが作成されていること
-- 2. Policiesで各テーブルのRLSポリシーが設定されていること
-- 3. 初期データが正しく投入されていること
