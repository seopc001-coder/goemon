// 五右衛門 ECサイト - トップページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeIndexPage();
});

function initializeIndexPage() {
    loadNewArrivals();
    loadRanking();
    loadSaleItems();
}

// 新着商品を読み込み
function loadNewArrivals() {
    const container = document.querySelector('.box-category-discount .list-products-01');
    if (!container) return;

    const products = [
        { id: '1', name: 'カジュアルコットンブラウス', price: 2990 },
        { id: '2', name: 'ニットカーディガン', price: 3490, originalPrice: 4990 },
        { id: '3', name: 'フローラルワンピース', price: 4990 },
        { id: '4', name: 'ハイウエストデニムパンツ', price: 3990 },
        { id: '5', name: 'レーストップス', price: 2490 },
        { id: '6', name: 'オーバーサイズニット', price: 3990 },
        { id: '7', name: 'マキシ丈スカート', price: 2990 },
        { id: '8', name: 'ストライプシャツ', price: 2490 },
        { id: '9', name: 'ワイドパンツ', price: 3490 },
        { id: '10', name: 'デニムジャケット', price: 5990 }
    ];

    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// ランキング商品を読み込み
function loadRanking() {
    const container = document.querySelector('.box-category-ranking .list-products-01');
    if (!container) return;

    const products = [
        { id: '11', name: 'ベーシックTシャツ', price: 1990, rank: 1 },
        { id: '12', name: 'スキニーデニム', price: 3490, rank: 2 },
        { id: '13', name: 'ロングカーディガン', price: 4490, rank: 3 },
        { id: '14', name: 'チェックシャツ', price: 2990, rank: 4 },
        { id: '15', name: 'プリーツスカート', price: 3290, rank: 5 },
        { id: '16', name: 'モックネックニット', price: 3990, rank: 6 },
        { id: '17', name: 'テーパードパンツ', price: 3690, rank: 7 },
        { id: '18', name: 'ボーダートップス', price: 2290, rank: 8 },
        { id: '19', name: 'フレアスカート', price: 2890, rank: 9 },
        { id: '20', name: 'MA-1ジャケット', price: 5490, rank: 10 }
    ];

    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
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

    const products = [
        { id: '31', name: 'フリルブラウス', price: 1490, originalPrice: 2990 },
        { id: '32', name: 'ワイドデニム', price: 1990, originalPrice: 3990 },
        { id: '33', name: 'ノーカラージャケット', price: 2990, originalPrice: 5990 },
        { id: '34', name: 'リブニット', price: 1790, originalPrice: 2990 },
        { id: '35', name: 'プリントスカート', price: 1990, originalPrice: 3490 },
        { id: '36', name: 'トレンチコート', price: 3990, originalPrice: 7990 },
        { id: '37', name: 'ボリュームスリーブニット', price: 2490, originalPrice: 3990 },
        { id: '38', name: 'チノパンツ', price: 1990, originalPrice: 3290 },
        { id: '39', name: 'シフォンブラウス', price: 1490, originalPrice: 2490 },
        { id: '40', name: 'ミディ丈スカート', price: 1790, originalPrice: 2990 }
    ];

    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
