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

    // デモ商品データを削除（1回のみ実行）
    clearDemoProductsOnce();

    // デフォルトデータを初期化（localStorageにない場合）
    initializeDefaultDataIfNeeded();

    // カテゴリーと商品タイプをlocalStorageから読み込み
    loadCategoriesToSelect();
    loadProductTypesToSelect();

    // 商品データを読み込み
    loadProducts();

    // 画像アップロード機能を初期化
    initializeImageUploads();

    // URLパラメータをチェック
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');

    if (filter === 'lowstock') {
        // 在庫が少ない商品のみ表示
        filterLowStockProducts();
    }

    // フォーム送信イベント
    document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);

    // 公開/非公開トグルボタンのイベント
    initializePublishToggle();

    // 検索入力時のイベント
    document.getElementById('searchInput').addEventListener('input', function(e) {
        if (e.target.value === '') {
            searchProducts();
        }
    });

    // 割引計算の自動更新
    setupDiscountCalculation();

    // ランキング表示チェックボックスの動作
    setupRankingCheckbox();
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

// デモ商品データを削除（1回のみ実行）
function clearDemoProductsOnce() {
    const cleared = localStorage.getItem('goemon_demo_cleared');

    if (!cleared) {
        console.log('🗑️ デモ商品データを削除します...');
        localStorage.removeItem('goemonproducts');
        localStorage.setItem('goemon_demo_cleared', 'true');
        console.log('✅ デモ商品データを削除しました');
    } else {
        console.log('✓ デモ商品データは既に削除済みです');
    }
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
            console.log('Loaded products from localStorage:', Object.keys(allProducts).length);
        } else {
            // デモデータは生成しない（ユーザーの要望により）
            allProducts = {};
            console.log('No products in localStorage - starting with empty data');
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

    // 新しい商品が上に来るように並び替え（IDの降順）
    productsArray.sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA; // 降順
    });

    grid.innerHTML = productsArray.map(product => {
        // 在庫数を取得（初期データ作成時に設定済み）
        const stock = product.stock || 0;
        const isLowStock = stock < 10;
        const isSoldOut = stock === 0;
        const soldOutConfirmed = product.soldOutConfirmed || false;
        const isPublished = product.isPublished !== false; // デフォルトはtrue

        return `
            <div class="product-card">
                <div class="product-image">
                    ${product.image ?
                        `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<i class="fas fa-image"></i>`
                    }
                    ${!isPublished ? `<div class="unpublished-badge">非公開</div>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name" title="${product.name}">${product.name}</h3>
                    <div class="product-price">¥${product.price.toLocaleString()}</div>
                    <div class="product-meta">
                        <span class="publish-status-badge ${isPublished ? 'published' : 'unpublished'}">
                            <i class="fas fa-${isPublished ? 'eye' : 'eye-slash'}"></i>
                            ${isPublished ? '公開中' : '非公開'}
                        </span>
                        <span class="stock-info ${isLowStock ? 'stock-low' : ''}">
                            <i class="fas fa-boxes"></i> 在庫: ${stock}
                            ${isSoldOut && !soldOutConfirmed ? '<span style="color: #ff4444; font-weight: bold; margin-left: 8px;">売り切れ</span>' : ''}
                            ${soldOutConfirmed ? '<span style="color: #999; margin-left: 8px;">確認済み</span>' : ''}
                        </span>
                        <span style="font-size: 12px; color: #999;">
                            ${product.category || '食品'}
                        </span>
                    </div>
                    <div class="product-actions">
                        ${isSoldOut && !soldOutConfirmed ? `
                            <button class="btn-small btn-confirm-soldout" onclick="confirmSoldOut('${product.id}')" style="background: #ff9800; color: white;">
                                <i class="fas fa-check"></i> 売り切れ確認
                            </button>
                        ` : ''}
                        <button class="btn-small btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">
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

    // 在庫が10未満かつ売り切れ確認済みでない商品のみ抽出
    Object.keys(allProducts).forEach(key => {
        const product = allProducts[key];
        const stock = product.stock || 0;
        // 売り切れ確認済み商品を除外
        if (stock < 10 && !product.soldOutConfirmed) {
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

// 公開/非公開トグルボタンを初期化
function initializePublishToggle() {
    const publishButtons = document.querySelectorAll('.publish-btn');
    const hiddenInput = document.getElementById('isPublished');

    publishButtons.forEach(button => {
        button.addEventListener('click', function() {
            // すべてのボタンから active クラスを削除
            publishButtons.forEach(btn => btn.classList.remove('active'));

            // クリックされたボタンに active クラスを追加
            this.classList.add('active');

            // hidden input の値を更新
            hiddenInput.value = this.dataset.value;
        });
    });
}

// 商品追加モーダルを開く
function openAddProductModal() {
    editingProductId = null;

    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> 商品を追加';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';

    // 画像プレビューをすべてクリア
    if (typeof clearImagePreview === 'function') {
        clearImagePreview('productImagePreview');
        clearImagePreview('productImage2Preview');
        clearImagePreview('productImage3Preview');
        clearImagePreview('productImage4Preview');
    }

    // ファイル入力もクリア
    const fileInputs = ['productImageFile', 'productImage2File', 'productImage3File', 'productImage4File'];
    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });

    // URL入力フィールドもクリア
    const urlInputs = ['productImage', 'productImage2', 'productImage3', 'productImage4'];
    urlInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });

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

    // 公開/非公開設定（トグルボタン）
    const isPublished = product.isPublished !== false; // デフォルトtrue
    document.getElementById('isPublished').value = isPublished.toString();

    // ボタンのアクティブ状態を更新
    const publishButtons = document.querySelectorAll('.publish-btn');
    publishButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === isPublished.toString()) {
            btn.classList.add('active');
        }
    });

    // ランキング設定
    const showInRankingCheckbox = document.getElementById('showInRanking');
    const rankingPositionGroup = document.getElementById('rankingPositionGroup');
    const rankingPositionInput = document.getElementById('rankingPosition');

    showInRankingCheckbox.checked = product.showInRanking || false;
    rankingPositionInput.value = product.rankingPosition || '';

    if (product.showInRanking) {
        rankingPositionGroup.style.display = 'block';
    } else {
        rankingPositionGroup.style.display = 'none';
    }

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
    const showInRanking = document.getElementById('showInRanking').checked;
    const rankingPosition = document.getElementById('rankingPosition').value ? parseInt(document.getElementById('rankingPosition').value) : null;
    const isPublished = document.getElementById('isPublished').value === 'true';

    // 非公開→公開の状態変化を検出
    const wasUnpublished = editingProductId && allProducts[editingProductId] && allProducts[editingProductId].isPublished === false;
    const willBePublished = isPublished;
    const needsNewId = wasUnpublished && willBePublished;

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
        image4: productImage4 || null,
        showInRanking: showInRanking,
        rankingPosition: showInRanking ? rankingPosition : null,
        isPublished: isPublished
    };

    if (editingProductId) {
        // 編集モード
        const existingProduct = allProducts[editingProductId];

        if (needsNewId) {
            // 非公開→公開: IDは変更せず、公開日時を更新して最新商品として上位表示
            allProducts[editingProductId] = {
                id: editingProductId,
                ...existingProduct,
                ...productData,
                viewCount: existingProduct.viewCount || 0,
                publishedAt: Date.now() // 公開日時を更新
            };

            showAlertModal('商品を公開しました（最新商品として上位表示されます）', 'success');
        } else {
            // 通常の編集
            allProducts[editingProductId] = {
                id: editingProductId, // IDを明示的に保持
                ...existingProduct,
                ...productData,
                viewCount: existingProduct.viewCount || 0,
                publishedAt: existingProduct.publishedAt || Date.now()
            };

            showAlertModal('商品を更新しました', 'success');
        }
    } else {
        // 新規追加モード
        console.log('=== 新規商品追加開始 ===');
        console.log('現在の商品数:', Object.keys(allProducts).length);

        const ids = Object.keys(allProducts).map(id => parseInt(id) || 0);
        const newId = String(Math.max(0, ...ids) + 1);

        console.log('既存のID一覧:', ids);
        console.log('新しいID:', newId);

        const newProduct = {
            id: newId,
            ...productData,
            viewCount: 0,
            publishedAt: isPublished ? Date.now() : null
        };

        console.log('新規商品データ:', newProduct);

        allProducts[newId] = newProduct;

        console.log('追加後の商品数:', Object.keys(allProducts).length);
        console.log('=== 新規商品追加完了 ===');

        showAlertModal('商品を追加しました', 'success');
    }

    // localStorageに保存
    console.log('localStorageに保存します。商品数:', Object.keys(allProducts).length);
    localStorage.setItem('goemonproducts', JSON.stringify(allProducts));

    // 保存確認
    const savedData = localStorage.getItem('goemonproducts');
    const parsedData = JSON.parse(savedData);
    console.log('localStorage保存後の商品数:', Object.keys(parsedData).length);

    // モーダルを閉じる
    closeProductModal();

    // 商品リストを再表示
    searchProducts();
}

// 商品を削除
function deleteProduct(productId) {
    console.log('🔴 deleteProduct関数が呼び出されました:', productId);

    const product = allProducts[productId];

    if (!product) {
        console.log('❌ 商品が見つかりません:', productId);
        showAlertModal('商品が見つかりません', 'error');
        return;
    }

    console.log('✅ 削除確認モーダルを表示します:', product.name);

    showConfirmModal(
        `「${product.name}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
        () => {
            console.log('🟢 確認モーダルのOKボタンがクリックされました');
            console.log('=== 削除処理開始 ===');
            console.log('削除対象商品ID:', productId);
            console.log('削除前のallProducts:', Object.keys(allProducts).length, '件');
            console.log('削除前にこの商品が存在:', productId in allProducts);

            // 商品を削除
            delete allProducts[productId];

            console.log('削除後のallProducts:', Object.keys(allProducts).length, '件');
            console.log('削除後にこの商品が存在:', productId in allProducts);

            // localStorageに保存
            localStorage.setItem('goemonproducts', JSON.stringify(allProducts));

            // 保存直後に確認
            const savedData = localStorage.getItem('goemonproducts');
            const parsedData = JSON.parse(savedData);
            console.log('localStorage保存後の商品数:', Object.keys(parsedData).length, '件');
            console.log('localStorageにこの商品が存在:', productId in parsedData);
            console.log('=== 削除処理完了 ===');

            showAlertModal('商品を削除しました', 'success');
            searchProducts();
        }
    );
}

// グローバルスコープに公開
window.deleteProduct = deleteProduct;

// 売り切れ確認
function confirmSoldOut(productId) {
    const product = allProducts[productId];

    if (!product) {
        showAlertModal('商品が見つかりません', 'error');
        return;
    }

    if (product.stock !== 0) {
        showAlertModal('この商品は売り切れではありません', 'error');
        return;
    }

    showConfirmModal(
        `「${product.name}」の売り切れを確認しますか？\n\n確認すると在庫アラートから除外されます。`,
        () => {
            // 売り切れ確認フラグを設定
            allProducts[productId].soldOutConfirmed = true;

            // localStorageに保存
            localStorage.setItem('goemonproducts', JSON.stringify(allProducts));

            showAlertModal('売り切れを確認しました', 'success');
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

    // 画像プレビューをすべてクリア
    if (typeof clearImagePreview === 'function') {
        clearImagePreview('productImagePreview');
        clearImagePreview('productImage2Preview');
        clearImagePreview('productImage3Preview');
        clearImagePreview('productImage4Preview');
    }

    // ファイル入力もクリア
    const fileInputs = ['productImageFile', 'productImage2File', 'productImage3File', 'productImage4File'];
    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });

    // URL入力フィールドもクリア（編集時に残らないように）
    const urlInputs = ['productImage', 'productImage2', 'productImage3', 'productImage4'];
    urlInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && !input.value.startsWith('http')) {
            // 既存のURLでない場合のみクリア
            input.value = '';
        }
    });
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

// 画像アップロード機能を初期化
function initializeImageUploads() {
    // 画像アップロードライブラリが読み込まれているか確認
    if (typeof setupFileInput !== 'function') {
        console.warn('Image upload library not loaded');
        return;
    }

    // 商品画像のファイル入力を設定
    setupFileInput('productImageFile', 'productImagePreview', 'productImage');
    setupFileInput('productImage2File', 'productImage2Preview', 'productImage2');
    setupFileInput('productImage3File', 'productImage3Preview', 'productImage3');
    setupFileInput('productImage4File', 'productImage4Preview', 'productImage4');

    console.log('Image upload functionality initialized');
}

// ランキングチェックボックスの動作を設定
function setupRankingCheckbox() {
    const showInRankingCheckbox = document.getElementById('showInRanking');
    const rankingPositionGroup = document.getElementById('rankingPositionGroup');

    if (showInRankingCheckbox && rankingPositionGroup) {
        showInRankingCheckbox.addEventListener('change', function() {
            if (this.checked) {
                rankingPositionGroup.style.display = 'block';
            } else {
                rankingPositionGroup.style.display = 'none';
                document.getElementById('rankingPosition').value = '';
            }
        });
    }
}
