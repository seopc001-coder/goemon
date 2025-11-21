-- ===================================
-- 五右衛門 ECサイト - Supabase RPC関数
-- ===================================
-- このSQLはSupabase SQLエディタで実行してください

-- ===================================
-- 1. 商品追加RPC関数（既存）
-- ===================================
CREATE OR REPLACE FUNCTION insert_product_with_uuid(
  p_id uuid,
  p_name text,
  p_price integer,
  p_original_price integer,
  p_category_id uuid,
  p_product_type_id uuid,
  p_stock integer,
  p_description text,
  p_image_url text,
  p_show_in_ranking boolean,
  p_ranking_position integer,
  p_is_published boolean,
  p_sold_out_confirmed boolean
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  INSERT INTO products (
    id, name, price, original_price, category_id, product_type_id,
    stock, description, image, show_in_ranking, ranking_position,
    is_published, sold_out_confirmed
  ) VALUES (
    p_id, p_name, p_price, p_original_price, p_category_id, p_product_type_id,
    p_stock, p_description, p_image_url, p_show_in_ranking, p_ranking_position,
    p_is_published, p_sold_out_confirmed
  )
  RETURNING row_to_json(products.*) INTO result;

  RETURN result;
END;
$$;

-- ===================================
-- 2. クーポン使用回数増加RPC関数
-- ===================================
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE code = coupon_code
  RETURNING row_to_json(coupons.*) INTO result;

  RETURN result;
END;
$$;

-- ===================================
-- 3. 全ユーザーと注文数取得RPC関数
-- ===================================
CREATE OR REPLACE FUNCTION get_all_users_with_orders()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_name text,
  first_name text,
  status text,
  deleted_at timestamptz,
  order_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id as user_id,
    up.email,
    up.created_at,
    up.family_name as last_name,
    up.given_name as first_name,
    up.status,
    up.updated_at as deleted_at,
    COUNT(o.id) as order_count
  FROM user_profiles up
  LEFT JOIN orders o ON up.id = o.user_id
  GROUP BY up.id, up.email, up.created_at, up.family_name, up.given_name, up.status, up.updated_at
  ORDER BY up.created_at DESC;
END;
$$;

-- ===================================
-- 4. 退会ユーザーをメールで検索RPC関数
-- ===================================
CREATE OR REPLACE FUNCTION search_withdrawn_user_by_email(search_email text)
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_name text,
  first_name text,
  status text,
  deleted_at timestamptz,
  deletion_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id as user_id,
    up.email,
    up.created_at,
    up.family_name as last_name,
    up.given_name as first_name,
    up.status,
    up.updated_at as deleted_at,
    '' as deletion_reason -- 削除理由フィールドがあれば追加
  FROM user_profiles up
  WHERE up.email = search_email
    AND up.status = 'withdrawn'
  LIMIT 1;
END;
$$;

-- ===================================
-- 完了メッセージ
-- ===================================
SELECT 'RPC関数の作成が完了しました' as message;
