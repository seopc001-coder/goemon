// 五右衛門 ECサイト - トップページ JavaScript

// グローバル変数
let allProducts = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeIndexPage();
});

function initializeIndexPage() {
    // 商品データを初期化
    if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
        allProducts = window.GOEMON_PRODUCTS.generateProductsData(100);
    }

    loadNewArrivals();
    loadRanking();
    loadSaleItems();
}

// 新着商品を読み込み
function loadNewArrivals() {
    const container = document.querySelector('.box-category-discount .list-products-01');
    if (!container) return;

    // ID 1-10の商品を表示
    const productIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    productIds.forEach(id => {
        const product = allProducts[id];
        if (product) {
            const card = createProductCard(product);
            container.appendChild(card);
        }
    });
}

// ランキング商品を読み込み
function loadRanking() {
    const container = document.querySelector('.box-category-ranking .list-products-01');
    if (!container) return;

    // ID 11-20の商品を表示
    const productIds = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

    productIds.forEach((id, index) => {
        const product = allProducts[id];
        if (product) {
            product.rank = index + 1;
            const card = createProductCard(product);
            container.appendChild(card);
        }
    });
}

// 商品カードを生成
function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'card-product-01';
    card.dataset.productId = product.id;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const rank = product.rank || null;

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
            ${rank ? `<div class="txt-ranking">${rank}</div>` : ''}
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


// セール商品を読み込み
function loadSaleItems() {
    const container = document.getElementById('saleProducts');
    if (!container) return;

    // ID 31-40の商品を表示
    const productIds = ['31', '32', '33', '34', '35', '36', '37', '38', '39', '40'];

    productIds.forEach(id => {
        const product = allProducts[id];
        if (product) {
            const card = createProductCard(product);
            container.appendChild(card);
        }
    });
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
