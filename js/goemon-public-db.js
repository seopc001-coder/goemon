// ===================================
// 五右衛門 ECサイト - 公開用Supabaseデータベース操作
// ===================================
// フロントエンド(非ログインユーザー含む)で使用する関数
console.log('🟢 PUBLIC-DB.JS LOADED - fetchPublishedProducts is now available');

// ===================================
// 商品取得(公開済みのみ)
// ===================================

/**
 * 公開済み商品を全件取得
 */
async function fetchPublishedProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_types (
                    name
                ),
                categories (
                    name
                )
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // アプリ用フォーマットに変換
        return (data || []).map(convertProductFromDB);
    } catch (error) {
        console.error('商品取得エラー:', error);
        // エラー時はlocalStorageから取得をフォールバック
        return getProductsFromLocalStorage();
    }
}

/**
 * 商品IDで取得
 */
async function fetchProductById(productId) {
    try {
        console.log('fetchProductById: 商品ID =', productId);

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_types (
                    name
                ),
                categories (
                    name
                )
            `)
            .eq('id', productId)
            .single();

        if (error) {
            console.error('商品取得エラー - 詳細:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        console.log('商品データ取得成功:', data);
        return data ? convertProductFromDB(data) : null;
    } catch (error) {
        console.error('商品取得エラー - キャッチ:', error);
        return null;
    }
}

/**
 * カテゴリーで商品を絞り込み
 */
async function fetchProductsByCategory(category) {
    try {
        // カテゴリー名からIDを取得
        const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', category)
            .single();

        if (categoryError) throw categoryError;

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_types (
                    name
                ),
                categories (
                    name
                )
            `)
            .eq('category_id', categoryData.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(convertProductFromDB);
    } catch (error) {
        console.error('商品取得エラー:', error);
        return [];
    }
}

/**
 * ランキング表示商品を取得
 */
async function fetchRankingProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_types (
                    name
                ),
                categories (
                    name
                )
            `)
            .eq('is_published', true)
            .eq('show_in_ranking', true)
            .not('ranking_position', 'is', null)
            .order('ranking_position', { ascending: true });

        if (error) throw error;
        return (data || []).map(convertProductFromDB);
    } catch (error) {
        console.error('ランキング商品取得エラー:', error);
        return [];
    }
}

// ===================================
// カテゴリー取得
// ===================================

/**
 * 全カテゴリーを取得
 */
async function fetchCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('カテゴリー取得エラー:', error);
        return getCategoriesFromLocalStorage();
    }
}

// ===================================
// 商品タイプ取得
// ===================================

/**
 * 全商品タイプを取得
 */
async function fetchProductTypes() {
    try {
        const { data, error } = await supabase
            .from('product_types')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('商品タイプ取得エラー:', error);
        return getProductTypesFromLocalStorage();
    }
}

// ===================================
// ヒーロー画像取得
// ===================================

/**
 * アクティブなヒーロー画像を取得
 */
async function fetchActiveHeroImages() {
    try {
        const { data, error } = await supabase
            .from('hero_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return (data || []).map(convertHeroImageFromDB);
    } catch (error) {
        console.error('ヒーロー画像取得エラー:', error);
        return getHeroImagesFromLocalStorage();
    }
}

// ===================================
// サイト設定取得
// ===================================

/**
 * サイト設定を取得
 */
async function fetchSiteSetting(key) {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .eq('key', key)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('サイト設定取得エラー:', error);
        return null;
    }
}

/**
 * 全サイト設定を取得
 */
async function fetchAllSiteSettings() {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*');

        if (error) throw error;

        // key: value形式のオブジェクトに変換
        const settings = {};
        (data || []).forEach(setting => {
            settings[setting.key] = setting.value;
        });

        return settings;
    } catch (error) {
        console.error('サイト設定取得エラー:', error);
        return {};
    }
}

/**
 * サイト設定を更新または作成
 */
async function updateSiteSetting(key, value) {
    try {
        // 既存の設定を確認
        const existing = await fetchSiteSetting(key);

        if (existing) {
            // 更新
            const { error } = await supabase
                .from('site_settings')
                .update({ value: value })
                .eq('key', key);

            if (error) throw error;
        } else {
            // 新規作成
            const { error } = await supabase
                .from('site_settings')
                .insert([{ key: key, value: value }]);

            if (error) throw error;
        }

        console.log(`サイト設定を更新しました: ${key} = ${value}`);
        return true;
    } catch (error) {
        console.error('サイト設定更新エラー:', error);
        throw error;
    }
}

// ===================================
// フォールバック用LocalStorage関数
// ===================================

/**
 * LocalStorageから商品を取得(フォールバック)
 */
function getProductsFromLocalStorage() {
    try {
        const saved = localStorage.getItem('goemonproducts');
        if (!saved) return [];

        const products = JSON.parse(saved);
        if (Array.isArray(products)) {
            return products.filter(p => p.isPublished !== false);
        } else {
            return Object.values(products).filter(p => p.isPublished !== false);
        }
    } catch (error) {
        console.error('LocalStorage商品取得エラー:', error);
        return [];
    }
}

/**
 * LocalStorageからカテゴリーを取得(フォールバック)
 */
function getCategoriesFromLocalStorage() {
    try {
        const saved = localStorage.getItem('goemonCategories');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('LocalStorageカテゴリー取得エラー:', error);
        return [];
    }
}

/**
 * LocalStorageから商品タイプを取得(フォールバック)
 */
function getProductTypesFromLocalStorage() {
    try {
        const saved = localStorage.getItem('goemonProductTypes');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('LocalStorage商品タイプ取得エラー:', error);
        return [];
    }
}

/**
 * LocalStorageからヒーロー画像を取得(フォールバック)
 */
function getHeroImagesFromLocalStorage() {
    try {
        const saved = localStorage.getItem('goemonHeroImages');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('LocalStorageヒーロー画像取得エラー:', error);
        return [];
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
        variants: dbProduct.variants, // バリエーションデータを追加
        confirmedSoldOutColors: dbProduct.confirmed_sold_out_colors,
        lowStockConfirmed: dbProduct.low_stock_confirmed,
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
// 商品閲覧数の更新
// ===================================

/**
 * 商品の閲覧数をインクリメント
 */
async function incrementProductViewCount(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('view_count')
            .eq('id', productId)
            .single();

        if (error) throw error;

        const currentCount = data?.view_count || 0;

        const { error: updateError } = await supabase
            .from('products')
            .update({ view_count: currentCount + 1 })
            .eq('id', productId);

        if (updateError) throw updateError;

        console.log(`Product ${productId} view count incremented to ${currentCount + 1}`);
    } catch (error) {
        console.error('閲覧数更新エラー:', error);
    }
}
