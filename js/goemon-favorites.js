// 五右衛門 ECサイト - お気に入りページ JavaScript

// グローバル変数
let wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];

// 商品データ（実際の実装ではAPIから取得）
const productsData = {
    '1': { id: '1', name: 'カジュアルコットンブラウス', price: 2990, image: '', colors: ['#fff', '#000', '#c691a5'] },
    '2': { id: '2', name: 'ニットカーディガン', price: 3490, originalPrice: 4990, image: '', colors: ['#8B7355', '#F5F5DC'] },
    '3': { id: '3', name: 'フローラルワンピース', price: 4990, image: '', colors: ['#FFB6C1', '#E6E6FA'] },
    '4': { id: '4', name: 'ハイウエストデニムパンツ', price: 3990, image: '', colors: ['#4169E1', '#000'] },
    '5': { id: '5', name: 'レーストップス', price: 2490, image: '', colors: ['#fff', '#000'] },
    '6': { id: '6', name: 'オーバーサイズニット', price: 3990, image: '', colors: ['#8B7355', '#000'] },
    '7': { id: '7', name: 'マキシ丈スカート', price: 2990, image: '', colors: ['#000', '#8B4513'] },
    '8': { id: '8', name: 'ストライプシャツ', price: 2490, image: '', colors: ['#4169E1', '#fff'] },
    '9': { id: '9', name: 'ワイドパンツ', price: 3490, image: '', colors: ['#8B7355', '#000'] },
    '10': { id: '10', name: 'デニムジャケット', price: 5990, image: '', colors: ['#4169E1', '#000'] }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeFavoritesPage();
});

function initializeFavoritesPage() {
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


