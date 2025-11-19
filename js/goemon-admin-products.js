// 五右衛門 ECサイト - 商品管理 JavaScript

let allProducts = {};
let filteredProducts = {};
let editingProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeProductManagement();
});

async function initializeProductManagement() {
    // 管理者権限チェック
    await checkAdminAccess();

    // デフォルトデータを初期化（localStorageにない場合）
    initializeDefaultDataIfNeeded();

    // カテゴリーと商品タイプをlocalStorageから読み込み
    loadCategoriesToSelect();
    loadProductTypesToSelect();

    // 商品データを読み込み
    loadProducts();

    // URLパラメータをチェック
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');

    if (filter === 'lowstock') {
        // 在庫が少ない商品のみ表示
        filterLowStockProducts();
    }

    // フォーム送信イベント
    document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);

    // 検索入力時のイベント
    document.getElementById('searchInput').addEventListener('input', function(e) {
        if (e.target.value === '') {
            searchProducts();
        }
    });

    // 割引計算の自動更新
    setupDiscountCalculation();
}

// 管理者権限チェック
async function checkAdminAccess() {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated');

    if (adminAuthenticated !== 'true') {
        window.location.href = 'goemon-admin-login.html';
        return;
    }

    const adminId = sessionStorage.getItem('adminId');
    console.log('Admin access granted for:', adminId);
}

// デフォルトデータを初期化（localStorageにない場合）
function initializeDefaultDataIfNeeded() {
    const categoriesExist = localStorage.getItem('goemoncategories');
    const productTypesExist = localStorage.getItem('goemonproducttypes');

    if (!categoriesExist) {
        const defaultCategories = [
            { id: 'outer', name: 'アウター', slug: 'outer', description: 'ジャケット、コートなど', order: 0 },
            { id: 'tops', name: 'トップス', slug: 'tops', description: 'シャツ、カットソーなど', order: 1 },
            { id: 'bottoms', name: 'ボトムス', slug: 'bottoms', description: 'パンツ、スカートなど', order: 2 },
            { id: 'onepiece', name: 'ワンピース', slug: 'onepiece', description: 'ワンピース・ドレス', order: 3 },
            { id: 'shoes', name: 'シューズ', slug: 'shoes', description: '靴・スニーカー', order: 4 },
            { id: 'bags', name: 'バッグ', slug: 'bags', description: 'バッグ・小物', order: 5 },
            { id: 'accessories', name: 'アクセサリー', slug: 'accessories', description: 'アクセサリー・小物', order: 6 }
        ];
        localStorage.setItem('goemoncategories', JSON.stringify(defaultCategories));
        console.log('Default categories initialized in product management');
    }

    if (!productTypesExist) {
        const defaultProductTypes = [
            { id: 'new-arrivals', name: '新着アイテム', slug: 'new-arrivals', description: '最新の入荷商品', order: 0 },
            { id: 'pre-order', name: '予約アイテム', slug: 'pre-order', description: '予約受付中の商品', order: 1 },
            { id: 'restock', name: '再入荷', slug: 'restock', description: '人気商品が再入荷', order: 2 }
        ];
        localStorage.setItem('goemonproducttypes', JSON.stringify(defaultProductTypes));
        console.log('Default product types initialized in product management');
    }
}

// カテゴリーをlocalStorageから読み込んでセレクトボックスに設定
function loadCategoriesToSelect() {
    try {
        const savedCategories = localStorage.getItem('goemoncategories');
        const selectElement = document.getElementById('productCategory');

        if (!selectElement) return;

        // 既存のオプションをクリア（最初の「選択してください」以外）
        selectElement.innerHTML = '<option value="">カテゴリーを選択してください</option>';

        if (savedCategories) {
            const categories = JSON.parse(savedCategories);

            // orderでソート
            categories.sort((a, b) => a.order - b.order);

            // カテゴリーをオプションとして追加
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.slug;
                option.textContent = category.name;
                selectElement.appendChild(option);
            });

            console.log('Categories loaded to select:', categories.length);
        } else {
            console.log('No categories found in localStorage');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// 商品タイプをlocalStorageから読み込んでセレクトボックスに設定
function loadProductTypesToSelect() {
    try {
        const savedProductTypes = localStorage.getItem('goemonproducttypes');
        const selectElement = document.getElementById('productType');

        if (!selectElement) return;

        // 既存のオプションをクリア（最初の「選択してください」以外）
        selectElement.innerHTML = '<option value="">商品タイプを選択してください（任意）</option>';

        if (savedProductTypes) {
            const productTypes = JSON.parse(savedProductTypes);

            // orderでソート
            productTypes.sort((a, b) => a.order - b.order);

            // 商品タイプをオプションとして追加
            productTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.slug;
                option.textContent = type.name;
                selectElement.appendChild(option);
            });

            console.log('Product types loaded to select:', productTypes.length);
        } else {
            console.log('No product types found in localStorage');
        }
    } catch (error) {
        console.error('Error loading product types:', error);
    }
}

// 割引計算の自動更新を設定
function setupDiscountCalculation() {
    const priceInput = document.getElementById('productPrice');
    const discountInput = document.getElementById('productDiscount');
    const discountPriceInput = document.getElementById('productDiscountPrice');

    function calculateDiscountPrice() {
        const price = parseFloat(priceInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;

        if (price > 0 && discount > 0 && discount <= 100) {
            const discountedPrice = Math.round(price * (1 - discount / 100));
            discountPriceInput.value = discountedPrice;
        } else {
            discountPriceInput.value = price;
        }
    }

    // 価格または割引率が変更されたら自動計算
    priceInput.addEventListener('input', calculateDiscountPrice);
    discountInput.addEventListener('input', calculateDiscountPrice);
}

// 商品データを読み込み
function loadProducts() {
    try {
        // localStorageから商品データを取得
        let savedProducts = localStorage.getItem('goemonproducts');

        if (savedProducts) {
            // 保存済みデータを使用
            allProducts = JSON.parse(savedProducts);
        } else {
            // データがない場合は生成
            if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
                allProducts = window.GOEMON_PRODUCTS.generateProductsData(100);

                // 各商品に在庫数を設定
                Object.keys(allProducts).forEach(key => {
                    const product = allProducts[key];
                    if (!product.hasOwnProperty('stock')) {
                        product.stock = Math.floor(Math.random() * 100);
                    }
                });

                // localStorageに保存
                localStorage.setItem('goemonproducts', JSON.stringify(allProducts));
            } else {
                console.error('GOEMON_PRODUCTS not loaded');
                allProducts = {};
            }
        }

        filteredProducts = { ...allProducts };
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showAlertModal('商品データの読み込みに失敗しました', 'error');
    }
}

// 商品を表示
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const productsArray = Object.values(products);

    if (productsArray.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-box-open"></i>
                <h3 style="margin-bottom: 10px;">商品がありません</h3>
                <p>新規商品追加ボタンから商品を追加してください</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = productsArray.map(product => {
        // 在庫数を取得（初期データ作成時に設定済み）
        const stock = product.stock || 0;
        const isLowStock = stock < 10;

        return `
            <div class="product-card">
                <div class="product-image">
                    ${product.image ?
                        `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<i class="fas fa-image"></i>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name" title="${product.name}">${product.name}</h3>
                    <div class="product-price">¥${product.price.toLocaleString()}</div>
                    <div class="product-meta">
                        <span class="stock-info ${isLowStock ? 'stock-low' : ''}">
                            <i class="fas fa-boxes"></i> 在庫: ${stock}
                        </span>
                        <span style="font-size: 12px; color: #999;">
                            ${product.category || '食品'}
                        </span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-small btn-edit" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 商品を検索
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

    if (searchTerm === '') {
        filteredProducts = { ...allProducts };
    } else {
        filteredProducts = {};
        Object.keys(allProducts).forEach(key => {
            const product = allProducts[key];
            if (product.name.toLowerCase().includes(searchTerm)) {
                filteredProducts[key] = product;
            }
        });
    }

    renderProducts(filteredProducts);
}

// 在庫が少ない商品をフィルタリング
function filterLowStockProducts() {
    filteredProducts = {};

    // 在庫が10未満の商品のみ抽出
    Object.keys(allProducts).forEach(key => {
        const product = allProducts[key];
        const stock = product.stock || 0;
        if (stock < 10) {
            filteredProducts[key] = product;
        }
    });

    renderProducts(filteredProducts);

    // 検索ボックスにヒントを表示
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = '在庫が少ない商品を表示中（在庫10未満）';
        searchInput.style.borderColor = '#ff9800';
    }
}

// 商品追加モーダルを開く
function openAddProductModal() {
    editingProductId = null;

    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> 商品を追加';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';

    const modal = document.getElementById('productModal');
    modal.classList.add('active');
}

// 商品編集モーダルを開く
function editProduct(productId) {
    const product = allProducts[productId];

    if (!product) {
        showAlertModal('商品が見つかりません', 'error');
        return;
    }

    editingProductId = productId;

    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> 商品を編集';
    document.getElementById('productId').value = productId;
    document.getElementById('productName').value = product.name;

    // 元の価格（originalPrice）がある場合はそれを使用、なければ現在の価格
    const originalPrice = product.originalPrice || product.price;
    document.getElementById('productPrice').value = originalPrice;

    // 割引率を計算して設定
    const discountPercent = product.originalPrice && product.price < product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    document.getElementById('productDiscount').value = discountPercent;
    document.getElementById('productDiscountPrice').value = product.price;

    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productType').value = product.productType || '';
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productDescription').value = product.description || '';

    // メイン画像とサブ画像を設定
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productImage2').value = product.image2 || '';
    document.getElementById('productImage3').value = product.image3 || '';
    document.getElementById('productImage4').value = product.image4 || '';

    const modal = document.getElementById('productModal');
    modal.classList.add('active');
}

// 商品フォーム送信処理
function handleProductFormSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value.trim();
    const productPrice = parseInt(document.getElementById('productPrice').value);
    const productDiscount = parseInt(document.getElementById('productDiscount').value) || 0;
    const productDiscountPrice = parseInt(document.getElementById('productDiscountPrice').value) || productPrice;
    const productCategory = document.getElementById('productCategory').value;
    const productType = document.getElementById('productType').value;
    const productStock = parseInt(document.getElementById('productStock').value);
    const productDescription = document.getElementById('productDescription').value.trim();
    const productImage = document.getElementById('productImage').value.trim();
    const productImage2 = document.getElementById('productImage2').value.trim();
    const productImage3 = document.getElementById('productImage3').value.trim();
    const productImage4 = document.getElementById('productImage4').value.trim();

    // バリデーション
    if (!productName) {
        showAlertModal('商品名を入力してください', 'warning');
        return;
    }

    if (productPrice < 0) {
        showAlertModal('価格は0以上で入力してください', 'warning');
        return;
    }

    if (!productCategory) {
        showAlertModal('カテゴリーを選択してください', 'warning');
        return;
    }

    if (productStock < 0) {
        showAlertModal('在庫数は0以上で入力してください', 'warning');
        return;
    }

    if (!productImage) {
        showAlertModal('メイン画像URLを入力してください', 'warning');
        return;
    }

    // 商品データを構築
    const productData = {
        name: productName,
        price: productDiscountPrice, // 販売価格
        originalPrice: productDiscount > 0 ? productPrice : null, // 割引がある場合のみ元の価格を保存
        category: productCategory,
        productType: productType || null, // 商品タイプ（任意）
        stock: productStock,
        description: productDescription,
        image: productImage,
        image2: productImage2 || null,
        image3: productImage3 || null,
        image4: productImage4 || null
    };

    if (editingProductId) {
        // 編集モード
        allProducts[editingProductId] = {
            ...allProducts[editingProductId],
            ...productData
        };

        showAlertModal('商品を更新しました', 'success');
    } else {
        // 新規追加モード
        const newId = Math.max(...Object.keys(allProducts).map(Number)) + 1;

        allProducts[newId] = {
            id: newId,
            ...productData
        };

        showAlertModal('商品を追加しました', 'success');
    }

    // localStorageに保存
    localStorage.setItem('goemonproducts', JSON.stringify(allProducts));

    // モーダルを閉じる
    closeProductModal();

    // 商品リストを再表示
    searchProducts();
}

// 商品を削除
function deleteProduct(productId) {
    const product = allProducts[productId];

    if (!product) {
        showAlertModal('商品が見つかりません', 'error');
        return;
    }

    showConfirmModal(
        `「${product.name}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
        () => {
            delete allProducts[productId];

            // localStorageに保存
            localStorage.setItem('goemonproducts', JSON.stringify(allProducts));

            showAlertModal('商品を削除しました', 'success');
            searchProducts();
        }
    );
}

// 商品モーダルを閉じる
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    document.getElementById('productForm').reset();
    editingProductId = null;
}

// モーダル外クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('productModal');

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }
});
