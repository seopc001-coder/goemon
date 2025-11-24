// 五右衛門 ECサイト - 商品一覧ページ JavaScript

// グローバル変数
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 20;
let filters = {
    category: 'all',
    productType: 'all',
    price: [],
    size: [],
    color: []
};
let sortOrder = 'new';

document.addEventListener('DOMContentLoaded', function() {
    initializeProductsPage();
});

async function initializeProductsPage() {
    await loadCategories(); // カテゴリを先に読み込み
    await loadProducts();
    initializeFilters();
    initializeSort();
    initializePagination();

    // URLパラメータからカテゴリーと商品タイプを取得して適用
    applyURLFilters();
}

// URLパラメータからフィルターを適用
async function applyURLFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const typeParam = urlParams.get('type');

    if (categoryParam) {
        // slugまたはnameからnameを取得
        const categories = await fetchCategories();
        const category = categories.find(c => c.slug === categoryParam || c.name === categoryParam);

        if (category) {
            // カテゴリーフィルターを適用（nameを使用）
            filters.category = category.name;

            // カテゴリーリンクのアクティブ状態を更新
            const categoryLinks = document.querySelectorAll('.category-list a');
            categoryLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.category === category.name) {
                    link.classList.add('active');
                }
            });

            // ページタイトルを更新
            updatePageTitle(categoryParam, 'category');

            console.log('Applied category filter from URL:', categoryParam, '→', category.name);
        }
    }

    if (typeParam) {
        // slugまたはnameからnameを取得
        const productTypes = await fetchProductTypes();
        const productType = productTypes.find(t => t.slug === typeParam || t.name === typeParam);

        if (productType) {
            // 商品タイプでフィルター（nameを使用）
            filters.productType = productType.name;

            // カテゴリが指定されていない場合のみタイトルを更新
            if (!categoryParam) {
                updatePageTitle(typeParam, 'type');
            }

            console.log('Applied product type filter from URL:', typeParam, '→', productType.name);
        }
    }

    // フィルターを適用して再表示
    if (categoryParam || typeParam) {
        applyFilters();
    }
}

// ページタイトルを更新
async function updatePageTitle(slug, filterType) {
    const titleElement = document.getElementById('pageTitle');
    const descriptionElement = document.getElementById('pageDescription');

    if (!titleElement) return;

    // URLパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');

    try {
        if (filterType === 'category') {
            // カテゴリー名をSupabaseから取得（slugまたはnameで検索）
            const categories = await fetchCategories();
            if (categories && categories.length > 0) {
                const category = categories.find(c => c.slug === slug || c.name === slug);
                if (category) {
                    // 商品タイプとカテゴリの両方が指定されている場合
                    if (typeParam) {
                        const productTypes = await fetchProductTypes();
                        if (productTypes && productTypes.length > 0) {
                            const productType = productTypes.find(t => t.slug === typeParam || t.name === typeParam);
                            if (productType) {
                                titleElement.innerHTML = `${productType.name}<br>↪${category.name}`;
                                if (descriptionElement) {
                                    descriptionElement.textContent = category.description;
                                }
                                return;
                            }
                        }
                    }
                    // カテゴリのみの場合
                    titleElement.textContent = category.name;
                    if (descriptionElement && category.description) {
                        descriptionElement.textContent = category.description;
                    }
                }
            }
        } else if (filterType === 'type') {
            // 商品タイプ名をSupabaseから取得（slugまたはnameで検索）
            const productTypes = await fetchProductTypes();
            if (productTypes && productTypes.length > 0) {
                const productType = productTypes.find(t => t.slug === slug || t.name === slug);
                if (productType) {
                    titleElement.textContent = productType.name;
                    if (descriptionElement && productType.description) {
                        descriptionElement.textContent = productType.description;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating page title:', error);
    }
}

// カテゴリをSupabaseから読み込んで表示
async function loadCategories() {
    try {
        const categoryList = document.getElementById('categoryList');

        if (!categoryList) {
            console.error('Category list element not found');
            return;
        }

        // 現在のURLパラメータを取得
        const urlParams = new URLSearchParams(window.location.search);
        const currentType = urlParams.get('type');

        // 「すべて」を最初に追加
        const allCategory = document.createElement('li');
        const allUrl = currentType ? `goemon-products.html?type=${currentType}` : 'goemon-products.html';
        allCategory.innerHTML = `<a href="${allUrl}" class="active" data-category="all">すべて</a>`;
        categoryList.appendChild(allCategory);

        // Supabaseからカテゴリを読み込み
        const categories = await fetchCategories();

        if (categories && categories.length > 0) {
            // 並び順でソート
            categories.sort((a, b) => a.display_order - b.display_order);

            // 各カテゴリを追加
            categories.forEach(category => {
                const li = document.createElement('li');
                // 商品タイプパラメータがあれば保持
                const categorySlug = category.slug || encodeURIComponent(category.name);
                const categoryUrl = currentType
                    ? `goemon-products.html?type=${currentType}&category=${categorySlug}`
                    : `goemon-products.html?category=${categorySlug}`;
                li.innerHTML = `<a href="${categoryUrl}" data-category="${category.name}">${category.name}</a>`;
                categoryList.appendChild(li);
            });

            console.log('Categories loaded:', categories.length);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// 商品データを読み込み（Supabaseから取得）
async function loadProducts() {
    try {
        // Supabaseから商品データを読み込み
        const products = await fetchPublishedProducts();
        allProducts = products;
        console.log('Loaded products from Supabase:', allProducts.length);
    } catch (error) {
        console.error('Error loading products from Supabase:', error);
        allProducts = [];
    }

    filteredProducts = [...allProducts];

    // 初期表示は新しい商品順にソート
    applySorting();

    renderProducts();
    updateProductCount();
}

// フィルター機能を初期化
function initializeFilters() {
    // カテゴリーフィルターは削除
    // loadCategories()で生成されたリンクがそのまま機能するため、イベントハンドラーは不要

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
    // URLパラメータをすべてクリアしてページをリロード
    window.location.href = 'goemon-products.html';
}

// フィルターを適用
function applyFilters() {
    console.log('🔍 Applying filters:', filters);
    console.log('📦 Total products before filtering:', allProducts.length);

    filteredProducts = allProducts.filter(product => {
        // 非公開商品を除外（最優先）
        if (product.isPublished === false) {
            return false;
        }

        // カテゴリーフィルター
        if (filters.category !== 'all' && product.category !== filters.category) {
            console.log(`❌ Product "${product.name}" filtered out by category: ${product.category} !== ${filters.category}`);
            return false;
        }

        // 商品タイプフィルター
        if (filters.productType !== 'all' && product.productType !== filters.productType) {
            console.log(`❌ Product "${product.name}" filtered out by type: ${product.productType} !== ${filters.productType}`);
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

    console.log('✅ Filtered products count:', filteredProducts.length);
    if (filteredProducts.length > 0) {
        console.log('📋 Sample filtered products:', filteredProducts.slice(0, 3).map(p => ({ name: p.name, category: p.category, productType: p.productType })));
    }

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
            // publishedAtで降順ソート（新しい順）、publishedAtがない場合はIDで降順
            filteredProducts.sort((a, b) => {
                const publishedAtA = a.publishedAt || 0;
                const publishedAtB = b.publishedAt || 0;
                if (publishedAtB !== publishedAtA) {
                    return publishedAtB - publishedAtA;
                }
                // publishedAtが同じ場合はIDで降順
                const idA = parseInt(a.id) || 0;
                const idB = parseInt(b.id) || 0;
                return idB - idA;
            });
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

    // 画像URLを確認
    const imageUrl = product.image || '';

    // 在庫チェック
    const isSoldOut = product.stock === 0;

    card.innerHTML = `
        <div class="product-image">
            <div class="product-img-wrapper">
                ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `
                <div class="product-placeholder">
                    <i class="fas fa-tshirt fa-3x"></i>
                </div>
                `}
                ${isSoldOut ? `<div class="sold-out-badge">売り切れ</div>` : ''}
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
