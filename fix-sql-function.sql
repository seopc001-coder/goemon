-- まず既存の関数を削除
DROP FUNCTION IF EXISTS get_all_users_with_orders();

-- 修正版の関数を作成（email型をVARCHAR(255)に変更）
CREATE OR REPLACE FUNCTION get_all_users_with_orders()
RETURNS TABLE (
    user_id UUID,
    email VARCHAR(255),
    created_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    last_name TEXT,
    first_name TEXT,
    status TEXT,
    deleted_at TIMESTAMPTZ,
    order_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email::VARCHAR(255),
        u.created_at,
        u.email_confirmed_at,
        (u.raw_user_meta_data->>'lastName')::TEXT AS last_name,
        (u.raw_user_meta_data->>'firstName')::TEXT AS first_name,
        (u.raw_user_meta_data->>'status')::TEXT AS status,
        (u.raw_user_meta_data->>'deleted_at')::TIMESTAMPTZ AS deleted_at,
        COUNT(o.id) AS order_count
    FROM auth.users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, u.email, u.created_at, u.email_confirmed_at, u.raw_user_meta_data
    ORDER BY u.created_at DESC;
END;
$$;
