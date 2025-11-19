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

// 商品データを読み込み
function loadProducts() {
    try {
        // 商品データを生成（goemon-products-data.jsから）
        if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
            allProducts = window.GOEMON_PRODUCTS.generateProductsData(100);
        } else {
            console.error('GOEMON_PRODUCTS not loaded');
            allProducts = {};
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
        // 在庫数がない場合は初期化
        if (!product.hasOwnProperty('stock')) {
            product.stock = Math.floor(Math.random() * 100);
        }
        const stock = product.stock;
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

    // 各商品に在庫数を設定（まだない場合）
    Object.keys(allProducts).forEach(key => {
        const product = allProducts[key];
        if (!product.hasOwnProperty('stock')) {
            product.stock = Math.floor(Math.random() * 100);
        }
    });

    // 在庫が10未満の商品のみ抽出
    Object.keys(allProducts).forEach(key => {
        const product = allProducts[key];
        if (product.stock < 10) {
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
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category || '食品';
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image || '';

    const modal = document.getElementById('productModal');
    modal.classList.add('active');
}

// 商品フォーム送信処理
function handleProductFormSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value.trim();
    const productPrice = parseInt(document.getElementById('productPrice').value);
    const productCategory = document.getElementById('productCategory').value;
    const productStock = parseInt(document.getElementById('productStock').value);
    const productDescription = document.getElementById('productDescription').value.trim();
    const productImage = document.getElementById('productImage').value.trim();

    // バリデーション
    if (!productName) {
        showAlertModal('商品名を入力してください', 'warning');
        return;
    }

    if (productPrice < 0) {
        showAlertModal('価格は0以上で入力してください', 'warning');
        return;
    }

    if (productStock < 0) {
        showAlertModal('在庫数は0以上で入力してください', 'warning');
        return;
    }

    if (editingProductId) {
        // 編集モード
        allProducts[editingProductId] = {
            ...allProducts[editingProductId],
            name: productName,
            price: productPrice,
            category: productCategory,
            stock: productStock,
            description: productDescription,
            image: productImage
        };

        showAlertModal('商品を更新しました', 'success');
    } else {
        // 新規追加モード
        const newId = Math.max(...Object.keys(allProducts).map(Number)) + 1;

        allProducts[newId] = {
            id: newId,
            name: productName,
            price: productPrice,
            category: productCategory,
            stock: productStock,
            description: productDescription,
            image: productImage
        };

        showAlertModal('商品を追加しました', 'success');
    }

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
