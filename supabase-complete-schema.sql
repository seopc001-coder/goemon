-- ===================================
-- 五右衛門 ECサイト - 完全版 Supabase スキーマ
-- ===================================
-- 実行前に必ずバックアップを取ってください
-- このSQLはSupabase SQLエディタで実行してください

-- ===================================
-- 1. カテゴリーテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 2. 商品タイプテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 3. 商品テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL,
    image_url TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    show_in_ranking BOOLEAN DEFAULT false,
    ranking_position INTEGER,
    is_published BOOLEAN DEFAULT true,
    sold_out_confirmed BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 4. ヒーロー画像テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS hero_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 5. ユーザープロファイルテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS user_profiles (
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
    status TEXT DEFAULT 'active', -- active, withdrawn
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 6. 配送先住所テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    family_name TEXT NOT NULL,
    given_name TEXT NOT NULL,
    family_name_kana TEXT NOT NULL,
    given_name_kana TEXT NOT NULL,
    phone TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    prefecture TEXT NOT NULL,
    city TEXT NOT NULL,
    address1 TEXT NOT NULL,
    address2 TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 7. カートテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ===================================
-- 8. お気に入りテーブル
-- ===================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ===================================
-- 9. 注文テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled

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
    payment_method TEXT NOT NULL, -- credit_card, bank_transfer, cod, etc.

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

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 10. 注文明細テーブル
-- ===================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 11. クーポンテーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- percentage, fixed_amount
    discount_value INTEGER NOT NULL, -- パーセンテージまたは固定額
    min_purchase_amount INTEGER DEFAULT 0, -- 最小購入金額
    max_discount_amount INTEGER, -- 最大割引額（パーセンテージタイプの場合）
    usage_limit INTEGER, -- 使用回数制限（NULL = 無制限）
    used_count INTEGER DEFAULT 0, -- 使用済み回数
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 12. クーポン使用履歴テーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 13. 商品レビューテーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false, -- 購入確認済み
    is_published BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0, -- 参考になった数
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 14. レビュー参考度投票テーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- ===================================
-- 15. サイト設定テーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type TEXT DEFAULT 'string', -- string, number, boolean, json
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 16. 管理者アクティビティログテーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- create, update, delete, etc.
    target_type TEXT NOT NULL, -- product, category, order, etc.
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 17. お知らせ・通知テーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- order, shipping, system, promotion
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 18. メールテンプレートテーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE, -- order_confirmation, shipping_notification, etc.
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB, -- 使用可能な変数のリスト
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 19. 在庫履歴テーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL, -- add, subtract, set
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    reason TEXT, -- order, restock, adjustment, etc.
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- 20. 配送方法テーブル（新規追加）
-- ===================================
CREATE TABLE IF NOT EXISTS shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_fee INTEGER NOT NULL DEFAULT 0,
    free_shipping_threshold INTEGER, -- この金額以上で送料無料
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- インデックス作成
-- ===================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_ranking ON products(show_in_ranking, ranking_position);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user ON admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_activity_logs(target_type, target_id);

-- ===================================
-- 自動更新トリガー
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
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
-- Row Level Security (RLS) 有効化
-- ===================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- ===================================
-- RLS ポリシー設定
-- ===================================

-- カテゴリー: 全員が読み取り可能
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);

-- 商品タイプ: 全員が読み取り可能
CREATE POLICY "product_types_select_all" ON product_types FOR SELECT USING (true);

-- 商品: 公開済み商品は全員が読み取り可能
CREATE POLICY "products_select_published" ON products FOR SELECT USING (is_published = true);

-- ヒーロー画像: アクティブな画像は全員が読み取り可能
CREATE POLICY "hero_images_select_active" ON hero_images FOR SELECT USING (is_active = true);

-- ユーザープロファイル: 自分のプロファイルのみ読み書き可能
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- 配送先住所: 自分の住所のみ読み書き可能
CREATE POLICY "shipping_addresses_select_own" ON shipping_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shipping_addresses_insert_own" ON shipping_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shipping_addresses_update_own" ON shipping_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shipping_addresses_delete_own" ON shipping_addresses FOR DELETE USING (auth.uid() = user_id);

-- カート: 自分のカートのみ読み書き可能
CREATE POLICY "carts_select_own" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "carts_insert_own" ON carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_update_own" ON carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "carts_delete_own" ON carts FOR DELETE USING (auth.uid() = user_id);

-- お気に入り: 自分のお気に入りのみ読み書き可能
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 注文: 自分の注文のみ読み取り可能
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 注文明細: 自分の注文の明細のみ読み取り可能
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- クーポン: アクティブで有効期間内のクーポンは全員が読み取り可能
CREATE POLICY "coupons_select_active" ON coupons FOR SELECT
USING (is_active = true AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW()));

-- クーポン使用履歴: 自分の使用履歴のみ読み取り可能
CREATE POLICY "coupon_usages_select_own" ON coupon_usages FOR SELECT USING (auth.uid() = user_id);

-- 商品レビュー: 公開済みレビューは全員が読み取り可能
CREATE POLICY "product_reviews_select_published" ON product_reviews FOR SELECT USING (is_published = true);
CREATE POLICY "product_reviews_insert_own" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "product_reviews_update_own" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "product_reviews_delete_own" ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- レビュー参考度投票: 自分の投票のみ読み書き可能
CREATE POLICY "review_helpful_votes_select_all" ON review_helpful_votes FOR SELECT USING (true);
CREATE POLICY "review_helpful_votes_insert_own" ON review_helpful_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_helpful_votes_delete_own" ON review_helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- サイト設定: 全員が読み取り可能
CREATE POLICY "site_settings_select_all" ON site_settings FOR SELECT USING (true);

-- 管理者ログ: 読み取り不可（管理者のみ）
-- 必要に応じて管理者ロールを設定してください

-- 通知: 自分の通知のみ読み書き可能
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- メールテンプレート: 全員が読み取り可能
CREATE POLICY "email_templates_select_all" ON email_templates FOR SELECT USING (true);

-- 在庫履歴: 全員が読み取り可能
CREATE POLICY "stock_history_select_all" ON stock_history FOR SELECT USING (true);

-- 配送方法: アクティブな配送方法は全員が読み取り可能
CREATE POLICY "shipping_methods_select_active" ON shipping_methods FOR SELECT USING (is_active = true);

-- ===================================
-- 初期データ投入
-- ===================================

-- カテゴリー初期データ
INSERT INTO categories (name, display_order) VALUES
('焼き菓子', 1),
('ケーキ', 2),
('季節限定', 3),
('その他', 4)
ON CONFLICT (name) DO NOTHING;

-- 商品タイプ初期データ
INSERT INTO product_types (name) VALUES
('クッキー'),
('タルト'),
('シュークリーム'),
('チーズケーキ'),
('チョコレート'),
('その他')
ON CONFLICT (name) DO NOTHING;

-- サイト設定初期データ
INSERT INTO site_settings (key, value, description, data_type) VALUES
('tax_rate', '10', '消費税率（%）', 'number'),
('free_shipping_threshold', '5000', '送料無料になる購入金額', 'number'),
('default_shipping_fee', '800', '基本送料', 'number'),
('site_maintenance_mode', 'false', 'メンテナンスモード', 'boolean'),
('points_per_100_yen', '1', '100円ごとに付与するポイント数', 'number')
ON CONFLICT (key) DO NOTHING;

-- 配送方法初期データ
INSERT INTO shipping_methods (name, description, base_fee, free_shipping_threshold, display_order) VALUES
('通常配送', '通常の宅配便での配送', 800, 5000, 1),
('速達配送', '速達での配送（翌日配達）', 1200, NULL, 2)
ON CONFLICT DO NOTHING;

-- メールテンプレート初期データ
INSERT INTO email_templates (template_key, subject, body, variables) VALUES
('order_confirmation', '【五右衛門】ご注文ありがとうございます', 'この度はご注文いただき、誠にありがとうございます。\n\n注文番号: {{order_number}}\n合計金額: ¥{{total}}\n\nご注文内容の詳細はマイページよりご確認いただけます。', '{"order_number": "注文番号", "total": "合計金額", "customer_name": "お客様名"}'),
('shipping_notification', '【五右衛門】商品を発送いたしました', 'ご注文いただいた商品を発送いたしました。\n\n注文番号: {{order_number}}\n配送業者: {{shipping_company}}\nお問い合わせ番号: {{tracking_number}}', '{"order_number": "注文番号", "shipping_company": "配送業者", "tracking_number": "お問い合わせ番号"}')
ON CONFLICT (template_key) DO NOTHING;

-- ===================================
-- 完了メッセージ
-- ===================================
-- このSQLの実行が完了したら、以下を確認してください:
-- 1. Supabase ダッシュボード > Table Editor で全20テーブルが作成されていること
-- 2. Authentication > Policies で各テーブルのRLSポリシーが設定されていること
-- 3. 初期データが正しく投入されていること
