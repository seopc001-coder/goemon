// ===================================
// 五右衛門 ECサイト - 管理者用Supabaseデータベース操作
// ===================================

// ===================================
// 商品管理
// ===================================

/**
 * 全商品を取得
 */
async function fetchAllProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories(name),
                product_types(name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('商品取得エラー:', error);
        throw error;
    }
}

/**
 * 商品を追加（RPC関数を使用してスキーマキャッシュをバイパス）
 */
async function addProduct(product) {
    try {
        // カテゴリー名からIDを取得
        let categoryId = null;
        if (product.category) {
            const { data: categories } = await supabase
                .from('categories')
                .select('id')
                .eq('name', product.category)
                .single();
            categoryId = categories?.id || null;
        }

        // 商品タイプ名からIDを取得
        let productTypeId = null;
        if (product.productType) {
            const { data: productTypes } = await supabase
                .from('product_types')
                .select('id')
                .eq('name', product.productType)
                .single();
            productTypeId = productTypes?.id || null;
        }

        // RPC関数を使用して商品を追加（スキーマキャッシュの問題を回避）
        const { data, error } = await supabase.rpc('insert_product_with_uuid', {
            p_id: product.id,
            p_name: product.name,
            p_price: product.price,
            p_original_price: product.originalPrice || null,
            p_category_id: categoryId,
            p_product_type_id: productTypeId,
            p_stock: product.stock || 0,
            p_description: product.description || null,
            p_image: product.image || null,
            p_image2: product.image2 || null,
            p_image3: product.image3 || null,
            p_image4: product.image4 || null,
            p_show_in_ranking: product.showInRanking || false,
            p_ranking_position: product.rankingPosition || null,
            p_is_published: product.isPublished !== false,
            p_sold_out_confirmed: product.soldOutConfirmed || false
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('商品追加エラー:', error);
        throw error;
    }
}

/**
 * 商品を更新
 */
async function updateProduct(productId, updates) {
    try {
        const updateData = {};

        // カテゴリー名からIDを取得
        if (updates.category !== undefined) {
            if (updates.category) {
                const { data: categories } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('name', updates.category)
                    .single();
                updateData.category_id = categories?.id || null;
            } else {
                updateData.category_id = null;
            }
        }

        // 商品タイプ名からIDを取得
        if (updates.productType !== undefined) {
            if (updates.productType) {
                const { data: productTypes } = await supabase
                    .from('product_types')
                    .select('id')
                    .eq('name', updates.productType)
                    .single();
                updateData.product_type_id = productTypes?.id || null;
            } else {
                updateData.product_type_id = null;
            }
        }

        // 渡されたフィールドのみを更新データに追加
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.price !== undefined) updateData.price = updates.price;
        if (updates.originalPrice !== undefined) updateData.original_price = updates.originalPrice || null;
        if (updates.stock !== undefined) updateData.stock = updates.stock;
        if (updates.description !== undefined) updateData.description = updates.description || null;
        if (updates.image !== undefined) updateData.image = updates.image || null;
        if (updates.image2 !== undefined) updateData.image2 = updates.image2 || null;
        if (updates.image3 !== undefined) updateData.image3 = updates.image3 || null;
        if (updates.image4 !== undefined) updateData.image4 = updates.image4 || null;
        if (updates.showInRanking !== undefined) updateData.show_in_ranking = updates.showInRanking;
        if (updates.rankingPosition !== undefined) updateData.ranking_position = updates.rankingPosition || null;
        if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;
        if (updates.soldOutConfirmed !== undefined) updateData.sold_out_confirmed = updates.soldOutConfirmed;

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('商品更新エラー:', error);
        throw error;
    }
}

/**
 * 商品を削除
 */
async function deleteProductFromDB(productId) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('商品削除エラー:', error);
        throw error;
    }
}

/**
 * 商品の公開状態を切り替え
 */
async function toggleProductPublish(productId, isPublished) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ is_published: isPublished })
            .eq('id', productId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('商品公開状態更新エラー:', error);
        throw error;
    }
}

/**
 * ランキング位置を更新
 */
async function updateProductRanking(productId, showInRanking, rankingPosition) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({
                show_in_ranking: showInRanking,
                ranking_position: rankingPosition
            })
            .eq('id', productId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('ランキング更新エラー:', error);
        throw error;
    }
}

/**
 * 在庫数を更新
 */
async function updateProductStock(productId, stock) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ stock: stock })
            .eq('id', productId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('在庫更新エラー:', error);
        throw error;
    }
}

// ===================================
// カテゴリー管理
// ===================================

/**
 * 全カテゴリーを取得
 */
async function fetchAllCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('カテゴリー取得エラー:', error);
        throw error;
    }
}

/**
 * カテゴリーを追加
 */
async function addCategory(name, displayOrder) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                name: name,
                display_order: displayOrder || 0
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('カテゴリー追加エラー:', error);
        throw error;
    }
}

/**
 * カテゴリーを削除
 */
async function deleteCategory(categoryId) {
    try {
        // このカテゴリーを使用している公開中の商品があるかチェック
        const { data: publishedProducts, error: checkError } = await supabase
            .from('products')
            .select('id')
            .eq('category_id', categoryId)
            .eq('is_published', true)
            .limit(1);

        if (checkError) throw checkError;

        if (publishedProducts && publishedProducts.length > 0) {
            throw new Error('このカテゴリーは公開中の商品で使用中のため削除できません');
        }

        // 非公開商品のカテゴリーをNULLに設定
        const { error: updateError } = await supabase
            .from('products')
            .update({ category_id: null })
            .eq('category_id', categoryId)
            .eq('is_published', false);

        if (updateError) throw updateError;

        // カテゴリーを削除
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('カテゴリー削除エラー:', error);
        throw error;
    }
}

// 設定画面から呼び出すための別名エクスポート
window.deleteCategoryFromDB = deleteCategory;

// ===================================
// 商品タイプ管理
// ===================================

/**
 * 全商品タイプを取得
 */
async function fetchAllProductTypes() {
    try {
        const { data, error } = await supabase
            .from('product_types')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('商品タイプ取得エラー:', error);
        throw error;
    }
}

/**
 * 商品タイプを追加
 */
async function addProductType(name, displayOrder) {
    try {
        const { data, error } = await supabase
            .from('product_types')
            .insert([{
                name: name,
                display_order: displayOrder || 0
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('商品タイプ追加エラー:', error);
        throw error;
    }
}

/**
 * 商品タイプを削除
 */
async function deleteProductType(typeId) {
    try {
        // この商品タイプを使用している公開中の商品があるかチェック
        const { data: publishedProducts, error: checkError } = await supabase
            .from('products')
            .select('id')
            .eq('product_type_id', typeId)
            .eq('is_published', true)
            .limit(1);

        if (checkError) throw checkError;

        if (publishedProducts && publishedProducts.length > 0) {
            throw new Error('この商品タイプは公開中の商品で使用中のため削除できません');
        }

        // 非公開商品の商品タイプをNULLに設定
        const { error: updateError } = await supabase
            .from('products')
            .update({ product_type_id: null })
            .eq('product_type_id', typeId)
            .eq('is_published', false);

        if (updateError) throw updateError;

        // 商品タイプを削除
        const { error } = await supabase
            .from('product_types')
            .delete()
            .eq('id', typeId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('商品タイプ削除エラー:', error);
        throw error;
    }
}

// 設定画面から呼び出すための別名エクスポート
window.deleteProductTypeFromDB = deleteProductType;

// ===================================
// ヒーロー画像管理
// ===================================

/**
 * 全ヒーロー画像を取得
 */
async function fetchAllHeroImages() {
    try {
        const { data, error } = await supabase
            .from('hero_images')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('ヒーロー画像取得エラー:', error);
        throw error;
    }
}

/**
 * ヒーロー画像を追加
 */
async function addHeroImage(heroImage) {
    try {
        const { data, error } = await supabase
            .from('hero_images')
            .insert([{
                image_url: heroImage.imageUrl,
                title: heroImage.title || null,
                subtitle: heroImage.subtitle || null,
                link_url: heroImage.linkUrl || null,
                display_order: heroImage.displayOrder || 0,
                is_active: heroImage.isActive !== false
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('ヒーロー画像追加エラー:', error);
        throw error;
    }
}

/**
 * ヒーロー画像を更新
 */
async function updateHeroImage(imageId, updates) {
    try {
        const { data, error } = await supabase
            .from('hero_images')
            .update({
                image_url: updates.imageUrl,
                title: updates.title || null,
                subtitle: updates.subtitle || null,
                link_url: updates.linkUrl || null,
                display_order: updates.displayOrder || 0,
                is_active: updates.isActive !== false
            })
            .eq('id', imageId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('ヒーロー画像更新エラー:', error);
        throw error;
    }
}

/**
 * ヒーロー画像を削除
 */
async function deleteHeroImage(imageId) {
    try {
        const { error } = await supabase
            .from('hero_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('ヒーロー画像削除エラー:', error);
        throw error;
    }
}

// ===================================
// データ変換ヘルパー関数
// ===================================

/**
 * Supabase商品データをアプリ用フォーマットに変換
 */
function convertProductFromDB(dbProduct) {
    return {
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price,
        originalPrice: dbProduct.original_price,
        category: dbProduct.categories?.name || null,
        productType: dbProduct.product_types?.name || null,
        stock: dbProduct.stock,
        description: dbProduct.description,
        image: dbProduct.image,
        image2: dbProduct.image2,
        image3: dbProduct.image3,
        image4: dbProduct.image4,
        showInRanking: dbProduct.show_in_ranking,
        rankingPosition: dbProduct.ranking_position,
        isPublished: dbProduct.is_published,
        soldOutConfirmed: dbProduct.sold_out_confirmed,
        createdAt: dbProduct.created_at,
        updatedAt: dbProduct.updated_at
    };
}

/**
 * Supabaseヒーロー画像データをアプリ用フォーマットに変換
 */
function convertHeroImageFromDB(dbImage) {
    return {
        id: dbImage.id,
        imageUrl: dbImage.image_url,
        linkUrl: dbImage.link_url,
        displayOrder: dbImage.display_order,
        isActive: dbImage.is_active,
        createdAt: dbImage.created_at,
        updatedAt: dbImage.updated_at
    };
}

// ===================================
// 注文管理（管理者用）
// ===================================

/**
 * 全注文を取得（管理者用）
 */
async function fetchAllOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('全注文取得エラー:', error);
        throw error;
    }
}

/**
 * 注文ステータスを更新（管理者用）
 */
async function updateOrderStatus(orderId, status) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('注文ステータス更新エラー:', error);
        throw error;
    }
}

/**
 * ユーザーIDで注文を取得
 */
async function fetchOrdersByUserId(userId) {
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
        console.error('ユーザー注文取得エラー:', error);
        throw error;
    }
}

// ===================================
// ユーザー管理（管理者用）
// ===================================

/**
 * 全ユーザーを取得（管理者用）
 * RPC関数を使用してauth.usersテーブルにアクセス
 */
async function fetchAllUsers() {
    try {
        // RPC関数を使用して全ユーザーと注文数を取得
        const { data: usersData, error: usersError } = await supabase
            .rpc('get_all_users_with_orders');

        if (usersError) throw usersError;

        console.log('📊 RPC関数から取得したユーザーデータ:', usersData);

        // 各ユーザーの登録住所を取得（user_profilesテーブルから）
        const usersWithAddresses = await Promise.all((usersData || []).map(async (user) => {
            // ユーザープロファイルから住所情報を取得
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('postal_code, prefecture, city, address1, address2, phone')
                .eq('id', user.user_id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.warn(`プロファイル取得エラー (ユーザーID: ${user.user_id}):`, profileError);
            }

            // マイページで追加登録した住所を取得（shipping_addressesテーブル）
            const { data: shippingAddresses, error: addressError } = await supabase
                .from('shipping_addresses')
                .select('*')
                .eq('user_id', user.user_id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (addressError) {
                console.warn(`配送先住所取得エラー (ユーザーID: ${user.user_id}):`, addressError);
            }

            // 住所リストを作成
            const addresses = [];

            // プロファイルの住所（登録時の住所）
            if (profile && profile.postal_code) {
                addresses.push({
                    postal_code: profile.postal_code,
                    prefecture: profile.prefecture,
                    city: profile.city,
                    address_line1: profile.address1,
                    address_line2: profile.address2,
                    phone_number: profile.phone,
                    is_default: true,
                    source: '登録時'
                });
            }

            // 追加登録された住所
            (shippingAddresses || []).forEach(addr => {
                addresses.push({
                    postal_code: addr.postal_code,
                    prefecture: addr.prefecture,
                    city: addr.city,
                    address_line1: addr.address1,
                    address_line2: addr.address2,
                    phone_number: addr.phone,
                    is_default: addr.is_default || false,
                    source: '追加登録'
                });
            });

            return {
                id: user.user_id,
                email: user.email,
                created_at: user.created_at,
                user_metadata: {
                    lastName: user.last_name || '',
                    firstName: user.first_name || '',
                    status: user.status,
                    deleted_at: user.deleted_at
                },
                order_count: user.order_count,
                addresses: addresses
            };
        }));

        return usersWithAddresses;
    } catch (error) {
        console.error('全ユーザー取得エラー:', error);
        throw error;
    }
}

/**
 * ユーザーの注文数を取得
 * 注意: fetchAllUsers()ですでに注文数が含まれているため、この関数は互換性維持用
 */
async function fetchUserOrderCount(userId) {
    try {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('ユーザー注文数取得エラー:', error);
        return 0;
    }
}

// ===================================
// クーポン管理
// ===================================

/**
 * 全クーポンを取得
 */
async function fetchAllCoupons() {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('クーポン取得エラー:', error);
        throw error;
    }
}

/**
 * クーポンを追加
 */
async function addCoupon(coupon) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .insert([{
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                min_purchase: coupon.minPurchase || 0,
                max_discount: coupon.maxDiscount || null,
                expiry_date: coupon.expiryDate,
                usage_limit: coupon.usageLimit || null,
                used_count: 0,
                description: coupon.description || null
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('クーポン追加エラー:', error);
        throw error;
    }
}

/**
 * クーポンを更新
 */
async function updateCoupon(couponId, updates) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .update({
                code: updates.code,
                type: updates.type,
                value: updates.value,
                min_purchase: updates.minPurchase || 0,
                max_discount: updates.maxDiscount || null,
                expiry_date: updates.expiryDate,
                usage_limit: updates.usageLimit || null,
                description: updates.description || null
            })
            .eq('id', couponId)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('クーポン更新エラー:', error);
        throw error;
    }
}

/**
 * クーポンを削除
 */
async function deleteCoupon(couponId) {
    try {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', couponId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('クーポン削除エラー:', error);
        throw error;
    }
}

/**
 * クーポンの使用回数を増加
 */
async function incrementCouponUsage(couponCode) {
    try {
        const { data, error } = await supabase
            .rpc('increment_coupon_usage', { coupon_code: couponCode });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('クーポン使用回数増加エラー:', error);
        throw error;
    }
}

// ===================================
// 退会ユーザー管理
// ===================================

/**
 * 退会済みユーザーを取得
 * RPC関数を使用してauth.usersテーブルにアクセス
 */
async function fetchWithdrawnUsers() {
    try {
        // 全ユーザーを取得してフィルタ
        const allUsers = await fetchAllUsers();
        const withdrawnUsers = allUsers.filter(user =>
            user.user_metadata && user.user_metadata.status === 'withdrawn'
        );

        return withdrawnUsers || [];
    } catch (error) {
        console.error('退会ユーザー取得エラー:', error);
        throw error;
    }
}

/**
 * 特定のメールアドレスで退会ユーザーを検索
 * RPC関数を使用してauth.usersテーブルにアクセス
 */
async function searchWithdrawnUserByEmail(email) {
    try {
        // RPC関数を使用して退会ユーザーを検索
        const { data, error } = await supabase
            .rpc('search_withdrawn_user_by_email', { search_email: email });

        if (error) throw error;

        if (!data || data.length === 0) {
            return null;
        }

        // RPC結果をAdmin API形式に変換
        const user = data[0];
        return {
            id: user.user_id,
            email: user.email,
            created_at: user.created_at,
            user_metadata: {
                lastName: user.last_name,
                firstName: user.first_name,
                status: user.status,
                deleted_at: user.deleted_at,
                deletion_reason: user.deletion_reason
            }
        };
    } catch (error) {
        console.error('退会ユーザー検索エラー:', error);
        throw error;
    }
}
