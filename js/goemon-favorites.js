// 五右衛門 ECサイト - お気に入りページ JavaScript

// グローバル変数
let wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];

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

function initializeFavoritesPage() {
    // 商品データを初期化
    initializeProductsData();

    // デバッグ: お気に入りデータを確認
    console.log('Wishlist data:', wishlist);
    console.log('Wishlist length:', wishlist.length);
    console.log('Products data loaded:', Object.keys(productsData).length);

    renderFavoritesList();
}

// お気に入りリストを描画
function renderFavoritesList() {
    const container = document.getElementById('favoritesContainer');
    const emptyState = document.getElementById('emptyFavorites');

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


