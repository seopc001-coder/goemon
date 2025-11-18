// 五右衛門 ECサイト - 商品一覧ページ JavaScript

// グローバル変数
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 20;
let filters = {
    category: 'all',
    price: [],
    size: [],
    color: []
};
let sortOrder = 'new';

document.addEventListener('DOMContentLoaded', function() {
    initializeProductsPage();
});

function initializeProductsPage() {
    loadProducts();
    initializeFilters();
    initializeSort();
    initializePagination();
}

// 商品データを読み込み（実際の実装ではAPIから取得）
function loadProducts() {
    // デモ用の商品データ
    allProducts = generateDemoProducts(100);
    filteredProducts = [...allProducts];
    renderProducts();
    updateProductCount();
}

// デモ商品データを生成
function generateDemoProducts(count) {
    const products = [];
    const names = [
        'カジュアルコットンブラウス', 'ニットカーディガン', 'フローラルワンピース',
        'ハイウエストデニムパンツ', 'レーストップス', 'オーバーサイズニット',
        'マキシ丈スカート', 'ストライプシャツ', 'ワイドパンツ', 'デニムジャケット'
    ];
    const categories = ['アウター', 'トップス', 'ボトムス', 'ワンピース', '小物'];
    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['white', 'black', 'pink', 'blue', 'beige'];

    for (let i = 0; i < count; i++) {
        const price = Math.floor(Math.random() * 8000) + 2000;
        const originalPrice = Math.random() > 0.7 ? price + Math.floor(Math.random() * 2000) : null;

        products.push({
            id: String(i + 1),
            name: names[i % names.length] + (i > 9 ? ` ${Math.floor(i / 10)}` : ''),
            price: price,
            originalPrice: originalPrice,
            category: categories[Math.floor(Math.random() * categories.length)],
            size: sizes[Math.floor(Math.random() * sizes.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            isNew: Math.random() > 0.5,
            popularity: Math.floor(Math.random() * 1000)
        });
    }

    return products;
}

// フィルター機能を初期化
function initializeFilters() {
    // カテゴリーフィルター
    const categoryLinks = document.querySelectorAll('.category-list a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const category = this.textContent.trim().split(' ')[0];
            filters.category = category === 'すべて' ? 'all' : category;
            applyFilters();
        });
    });

    // 価格フィルター
    const priceCheckboxes = document.querySelectorAll('input[name="price"]');
    priceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                filters.price.push(this.value);
            } else {
                filters.price = filters.price.filter(p => p !== this.value);
            }
            applyFilters();
        });
    });

    // サイズフィルター
    const sizeCheckboxes = document.querySelectorAll('input[name="size"]');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                filters.size.push(this.value);
            } else {
                filters.size = filters.size.filter(s => s !== this.value);
            }
            applyFilters();
        });
    });

    // カラーフィルター
    const colorCheckboxes = document.querySelectorAll('input[name="color"]');
    colorCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                filters.color.push(this.value);
            } else {
                filters.color = filters.color.filter(c => c !== this.value);
            }
            applyFilters();
        });
    });

    // フィルターリセットボタン
    const resetBtn = document.querySelector('.btn-reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

// フィルターをリセット
function resetFilters() {
    filters = {
        category: 'all',
        price: [],
        size: [],
        color: []
    };

    // すべてのチェックボックスをリセット
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // カテゴリーをリセット
    const categoryLinks = document.querySelectorAll('.category-list a');
    categoryLinks.forEach(link => link.classList.remove('active'));
    categoryLinks[0]?.classList.add('active');

    applyFilters();
}

// フィルターを適用
function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        // カテゴリーフィルター
        if (filters.category !== 'all' && product.category !== filters.category) {
            return false;
        }

        // 価格フィルター
        if (filters.price.length > 0) {
            let matchesPrice = false;
            filters.price.forEach(range => {
                if (range === '0-2000' && product.price < 2000) matchesPrice = true;
                if (range === '2000-3000' && product.price >= 2000 && product.price < 3000) matchesPrice = true;
                if (range === '3000-5000' && product.price >= 3000 && product.price < 5000) matchesPrice = true;
                if (range === '5000-' && product.price >= 5000) matchesPrice = true;
            });
            if (!matchesPrice) return false;
        }

        // サイズフィルター
        if (filters.size.length > 0 && !filters.size.includes(product.size)) {
            return false;
        }

        // カラーフィルター
        if (filters.color.length > 0 && !filters.color.includes(product.color)) {
            return false;
        }

        return true;
    });

    applySorting();
    currentPage = 1;
    renderProducts();
    updateProductCount();
    renderPagination();
}

// ソート機能を初期化
function initializeSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        sortOrder = this.value;
        applySorting();
        renderProducts();
    });
}

// ソートを適用
function applySorting() {
    switch (sortOrder) {
        case 'new':
            filteredProducts.sort((a, b) => b.id - a.id);
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'popular':
            filteredProducts.sort((a, b) => b.popularity - a.popularity);
            break;
    }
}

// 商品を描画
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    if (productsToDisplay.length === 0) {
        grid.innerHTML = '<div class="no-products"><p>該当する商品がありません</p></div>';
        return;
    }

    productsToDisplay.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
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

// ページネーションを初期化
function initializePagination() {
    renderPagination();
}

// ページネーションを描画
function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    pagination.innerHTML = '';

    // 前へボタン
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn page-prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    pagination.appendChild(prevBtn);

    // ページ番号ボタン
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-number';
        pageBtn.textContent = i;
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => changePage(i));
        pagination.appendChild(pageBtn);
    }

    // 次へボタン
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn page-next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    pagination.appendChild(nextBtn);
}

// ページを変更
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderProducts();
    renderPagination();

    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 商品数を更新
function updateProductCount() {
    const countElement = document.getElementById('productCount');
    if (countElement) {
        countElement.textContent = `${filteredProducts.length}件`;
    }
}



// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
