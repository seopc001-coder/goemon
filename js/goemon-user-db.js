// ===================================
// 五右衛門 ECサイト - ユーザー用Supabaseデータベース操作
// ===================================

// ===================================
// ユーザープロファイル管理
// ===================================

/**
 * ユーザープロファイルを取得
 */
async function fetchUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('ユーザープロファイル取得エラー:', error);
        throw error;
    }
}

/**
 * ユーザープロファイルを作成
 */
async function createUserProfile(userId, profile) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert([{
                id: userId,
                email: profile.email,
                display_name: profile.displayName || null,
                family_name: profile.familyName || null,
                given_name: profile.givenName || null,
                family_name_kana: profile.familyNameKana || null,
                given_name_kana: profile.givenNameKana || null,
                phone: profile.phone || null,
                postal_code: profile.postalCode || null,
                prefecture: profile.prefecture || null,
                city: profile.city || null,
                address1: profile.address1 || null,
                address2: profile.address2 || null,
                status: 'active'
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('ユーザープロファイル作成エラー:', error);
        throw error;
    }
}

/**
 * ユーザープロファイルを更新
 */
async function updateUserProfile(userId, updates) {
    try {
        const updateData = {
            display_name: updates.displayName || null,
            family_name: updates.familyName || null,
            given_name: updates.givenName || null,
            family_name_kana: updates.familyNameKana || null,
            given_name_kana: updates.givenNameKana || null,
            phone: updates.phone || null,
            postal_code: updates.postalCode || null,
            prefecture: updates.prefecture || null,
            city: updates.city || null,
            address1: updates.address1 || null,
            address2: updates.address2 || null
        };

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', userId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('ユーザープロファイル更新エラー:', error);
        throw error;
    }
}

// ===================================
// 配送先住所管理
// ===================================

/**
 * ユーザーの全配送先住所を取得
 */
async function fetchShippingAddresses(userId) {
    try {
        const { data, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('配送先住所取得エラー:', error);
        throw error;
    }
}

/**
 * 配送先住所を追加
 */
async function addShippingAddress(userId, address) {
    try {
        const { data, error } = await supabase
            .from('shipping_addresses')
            .insert([{
                user_id: userId,
                address_name: address.addressName || null,
                family_name: address.familyName,
                given_name: address.givenName,
                family_name_kana: address.familyNameKana || null,
                given_name_kana: address.givenNameKana || null,
                postal_code: address.postalCode,
                prefecture: address.prefecture,
                city: address.city,
                address: address.address,
                building: address.building || null,
                phone: address.phone,
                is_default: address.isDefault || false
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('配送先住所追加エラー:', error);
        throw error;
    }
}

/**
 * 配送先住所を更新
 */
async function updateShippingAddress(addressId, updates) {
    try {
        const { data, error } = await supabase
            .from('shipping_addresses')
            .update({
                address_name: updates.addressName || null,
                family_name: updates.familyName,
                given_name: updates.givenName,
                family_name_kana: updates.familyNameKana || null,
                given_name_kana: updates.givenNameKana || null,
                postal_code: updates.postalCode,
                prefecture: updates.prefecture,
                city: updates.city,
                address: updates.address,
                building: updates.building || null,
                phone: updates.phone,
                is_default: updates.isDefault || false
            })
            .eq('id', addressId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('配送先住所更新エラー:', error);
        throw error;
    }
}

/**
 * 配送先住所を削除
 */
async function deleteShippingAddress(addressId) {
    try {
        const { error } = await supabase
            .from('shipping_addresses')
            .delete()
            .eq('id', addressId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('配送先住所削除エラー:', error);
        throw error;
    }
}

// ===================================
// カート管理
// ===================================

/**
 * ユーザーのカートアイテムを取得
 */
async function fetchCartItems(userId) {
    try {
        const { data, error } = await supabase
            .from('carts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('カート取得エラー:', error);
        throw error;
    }
}

/**
 * カートにアイテムを追加（Supabaseに直接追加）
 * goemon-cart.jsのaddToCart関数と区別するため名前を変更
 */
async function addCartItemToDb(userId, item) {
    console.log('>>> [goemon-user-db.js] addCartItemToDb関数が開始されました');
    console.log('>>> [goemon-user-db.js] userId:', userId);
    console.log('>>> [goemon-user-db.js] item:', item);

    try {
        console.log('>>> [goemon-user-db.js] Supabase insertを実行します...');
        const { data, error } = await supabase
            .from('carts')
            .insert([{
                user_id: userId,
                product_id: item.productId,
                quantity: item.quantity,
                color: item.color || null,
                size: item.size || null
            }])
            .select();

        console.log('>>> [goemon-user-db.js] Supabase insert完了。data:', data, 'error:', error);

        if (error) {
            console.error('>>> [goemon-user-db.js] Supabaseエラーが発生:', error);
            throw error;
        }

        console.log('>>> [goemon-user-db.js] addCartItemToDb関数が正常に完了しました');
        return data[0];
    } catch (error) {
        console.error('>>> [goemon-user-db.js] カート追加エラー:', error);
        throw error;
    }
}

/**
 * カートアイテムの数量を更新
 */
async function updateCartItemQuantity(cartItemId, quantity) {
    try {
        const { data, error } = await supabase
            .from('carts')
            .update({ quantity: quantity })
            .eq('id', cartItemId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('カート数量更新エラー:', error);
        throw error;
    }
}

/**
 * カートアイテムを削除
 */
async function removeFromCart(cartItemId) {
    try {
        const { error } = await supabase
            .from('carts')
            .delete()
            .eq('id', cartItemId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('カート削除エラー:', error);
        throw error;
    }
}

/**
 * カートを空にする
 */
async function clearCart(userId) {
    try {
        const { error } = await supabase
            .from('carts')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('カートクリアエラー:', error);
        throw error;
    }
}

// ===================================
// お気に入り管理
// ===================================

/**
 * ユーザーのお気に入りを取得
 */
async function fetchFavorites(userId) {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('お気に入り取得エラー:', error);
        throw error;
    }
}

/**
 * お気に入りに追加
 */
async function addToFavorites(userId, productId) {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .insert([{
                user_id: userId,
                product_id: productId
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('お気に入り追加エラー:', error);
        throw error;
    }
}

/**
 * お気に入りから削除
 */
async function removeFromFavorites(favoriteId) {
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('お気に入り削除エラー:', error);
        throw error;
    }
}

/**
 * 商品IDでお気に入りから削除
 */
async function removeFromFavoritesByProductId(userId, productId) {
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('お気に入り削除エラー:', error);
        throw error;
    }
}

// ===================================
// 注文管理
// ===================================

/**
 * ユーザーの注文履歴を取得
 */
async function fetchOrders(userId) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('注文履歴取得エラー:', error);
        throw error;
    }
}

/**
 * 注文を作成
 */
async function createOrder(userId, orderData) {
    try {
        // 注文番号を生成
        const orderNumber = 'GO' + Date.now();

        // 注文を作成
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: userId,
                order_number: orderNumber,
                status: 'pending',
                purchaser_family_name: orderData.purchaserFamilyName,
                purchaser_given_name: orderData.purchaserGivenName,
                purchaser_family_name_kana: orderData.purchaserFamilyNameKana,
                purchaser_given_name_kana: orderData.purchaserGivenNameKana,
                purchaser_phone: orderData.purchaserPhone,
                purchaser_email: orderData.purchaserEmail,
                shipping_family_name: orderData.shippingFamilyName,
                shipping_given_name: orderData.shippingGivenName,
                shipping_family_name_kana: orderData.shippingFamilyNameKana,
                shipping_given_name_kana: orderData.shippingGivenNameKana,
                shipping_phone: orderData.shippingPhone,
                shipping_postal_code: orderData.shippingPostalCode,
                shipping_prefecture: orderData.shippingPrefecture,
                shipping_city: orderData.shippingCity,
                shipping_address1: orderData.shippingAddress1,
                shipping_address2: orderData.shippingAddress2 || null,
                payment_method: orderData.paymentMethod,
                subtotal: orderData.subtotal,
                shipping_fee: orderData.shippingFee,
                tax: orderData.tax,
                discount: orderData.discount || 0,
                total: orderData.total,
                coupon_code: orderData.couponCode || null,
                delivery_date: orderData.deliveryDate || null,
                delivery_time: orderData.deliveryTime || null,
                notes: orderData.notes || null
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // 注文明細を作成
        if (orderData.items && orderData.items.length > 0) {
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                product_id: item.productId,
                product_name: item.productName,
                product_price: item.productPrice,
                quantity: item.quantity,
                color: item.color || null,
                size: item.size || null,
                subtotal: item.subtotal
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;
        }

        return order;
    } catch (error) {
        console.error('注文作成エラー:', error);
        throw error;
    }
}

/**
 * 注文をキャンセル
 */
async function cancelOrder(orderId) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('注文キャンセルエラー:', error);
        throw error;
    }
}

// ===================================
// 通知管理
// ===================================

/**
 * ユーザーの通知を取得
 */
async function fetchNotifications(userId) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('通知取得エラー:', error);
        throw error;
    }
}

/**
 * 通知を既読にする
 */
async function markNotificationAsRead(notificationId) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('通知既読エラー:', error);
        throw error;
    }
}

/**
 * 全通知を既読にする
 */
async function markAllNotificationsAsRead(userId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('全通知既読エラー:', error);
        throw error;
    }
}

// ===================================
// クーポン管理
// ===================================

/**
 * 有効なクーポンを取得（有効期限内、使用上限未達）
 */
async function fetchValidCoupons() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .gte('expiry_date', today)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 使用上限チェック（usage_limitがnullの場合は無制限）
        const validCoupons = (data || []).filter(coupon => {
            if (coupon.usage_limit === null) return true;
            return coupon.used_count < coupon.usage_limit;
        });

        return validCoupons;
    } catch (error) {
        console.error('有効なクーポン取得エラー:', error);
        throw error;
    }
}

/**
 * クーポンコードで検証
 */
async function validateCouponCode(couponCode) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', couponCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { valid: false, message: '無効なクーポンコードです' };
            }
            throw error;
        }

        // 有効期限チェック
        const today = new Date().toISOString().split('T')[0];
        if (data.expiry_date < today) {
            return { valid: false, message: 'このクーポンは有効期限が切れています' };
        }

        // 使用上限チェック
        if (data.usage_limit !== null && data.used_count >= data.usage_limit) {
            return { valid: false, message: 'このクーポンは使用上限に達しています' };
        }

        return { valid: true, coupon: data };
    } catch (error) {
        console.error('クーポン検証エラー:', error);
        throw error;
    }
}
