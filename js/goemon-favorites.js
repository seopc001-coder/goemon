// 五右衛門 ECサイト - お気に入りページ JavaScript

// グローバル変数
let wishlist = [];
let currentUser = null;

// 商品データ（共通データを使用）
let productsData = {};

// 商品データを初期化
function initializeProductsData() {
    if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
        productsData = window.GOEMON_PRODUCTS.generateProductsData(100);
    } else {
        console.error('GOEMON_PRODUCTS not loaded');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeFavoritesPage();
});

async function initializeFavoritesPage() {
    // 商品データを初期化
    initializeProductsData();

    // ログイン状態を確認してお気に入りを読み込み
    await loadFavorites();

    renderFavoritesList();
}

// お気に入りを読み込み（Supabaseから）
async function loadFavorites() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // ログインしていない場合はlocalStorageから読み込み
            wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
            console.log('Not logged in, using localStorage:', wishlist);
            return;
        }

        currentUser = user;

        // Supabaseからお気に入りを取得
        const { data, error } = await supabase
            .from('user_favorites')
            .select('product_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error loading favorites:', error);
            // エラーの場合はlocalStorageから読み込み
            wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
            return;
        }

        // 商品IDの配列に変換
        wishlist = data.map(item => item.product_id);
        console.log('Loaded favorites from Supabase:', wishlist);

        // localStorageも更新
        localStorage.setItem('goemonwishlist', JSON.stringify(wishlist));

    } catch (error) {
        console.error('Error in loadFavorites:', error);
        wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
    }
}

// お気に入りリストを描画
function renderFavoritesList() {
    const container = document.getElementById('favoritesContainer');
    const emptyState = document.getElementById('emptyFavorites');

    console.log('Rendering favorites, wishlist:', wishlist);
    console.log('Products data available:', Object.keys(productsData).length);

    if (wishlist.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';
    container.innerHTML = '';

    wishlist.forEach(productId => {
        const product = productsData[productId];
        console.log(`Product ${productId}:`, product);
        if (!product) return;

        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// 商品カードを生成
function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'card-product-01';
    card.dataset.productId = product.id;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;

    // 割引率を計算
    let discountPercent = '';
    if (hasDiscount) {
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        discountPercent = `${discount}%OFF`;
    }

    card.innerHTML = `
        <div class="product-image">
            <div class="product-img-wrapper">
                <div class="product-placeholder">
                    <i class="fas fa-tshirt fa-3x"></i>
                </div>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">
                <span class="price-current">¥${product.price.toLocaleString()}</span>
                ${hasDiscount ? `<span class="price-original">¥${product.originalPrice.toLocaleString()}</span>` : ''}
                ${hasDiscount ? `<span class="price-discount">${discountPercent}</span>` : ''}
            </div>
        </div>
    `;

    // 商品カードクリック
    card.addEventListener('click', function() {
        window.location.href = `goemon-product.html?id=${product.id}`;
    });

    return card;
}
