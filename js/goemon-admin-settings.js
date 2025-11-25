// 五右衛門 ECサイト - 設定管理 JavaScript

console.log('goemon-admin-settings.js loaded');

let categories = [];
let productTypes = [];
let heroImages = [];
let editingCategoryId = null;
let editingProductTypeId = null;
let editingHeroImageId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    initializeSettings();
});

async function initializeSettings() {
    console.log('initializeSettings called');

    // 管理者権限チェック
    await checkAdminAccess();

    // 初回訪問時にデフォルトデータをセット
    initializeDefaultData();

    // データを読み込み
    loadCategories();
    loadProductTypes();
    loadHeroImages();

    // フォーム送信イベント
    document.getElementById('categoryForm').addEventListener('submit', handleCategoryFormSubmit);
    document.getElementById('productTypeForm').addEventListener('submit', handleProductTypeFormSubmit);
    document.getElementById('heroImageForm').addEventListener('submit', handleHeroImageFormSubmit);
    document.getElementById('pointSettingsForm').addEventListener('submit', handlePointSettingsFormSubmit);

    // 画像アップロード機能を初期化
    initializeImageUploads();

    // システム設定を読み込み
    loadSystemSettings();

    console.log('initializeSettings completed - Global functions available:', {
        openAddCategoryModal: typeof window.openAddCategoryModal,
        editCategory: typeof window.editCategory,
        openAddProductTypeModal: typeof window.openAddProductTypeModal,
        editProductType: typeof window.editProductType,
        openAddHeroImageModal: typeof window.openAddHeroImageModal,
        editHeroImage: typeof window.editHeroImage
    });
}

// 初回訪問時にデフォルトデータをセット
function initializeDefaultData() {
    // バージョン管理で強制更新
    const currentVersion = '1.0.2';
    const savedVersion = localStorage.getItem('goemonSettingsVersion');

    if (savedVersion !== currentVersion) {
        console.log('Initializing default data (version update)');

        // デフォルトカテゴリをセット
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

        // デフォルト商品タイプをセット
        const defaultProductTypes = [
            { id: 'new-arrivals', name: '新着アイテム', slug: 'new-arrivals', description: '最新の入荷商品', tag: 'NEW', tagColor: 'green', order: 0 },
            { id: 'pre-order', name: '予約アイテム', slug: 'pre-order', description: '予約受付中の商品', tag: '予約', tagColor: 'orange', order: 1 },
            { id: 'restock', name: '再入荷', slug: 'restock', description: '人気商品が再入荷', tag: '再入荷', tagColor: 'purple', order: 2 },
            { id: 'sale', name: 'SALE', slug: 'sale', description: 'セール対象商品', tag: 'SALE', tagColor: 'red', order: 3 }
        ];
        localStorage.setItem('goemonproducttypes', JSON.stringify(defaultProductTypes));

        // デフォルトヒーロー画像をセット
        const defaultHeroImages = [
            {
                id: 'hero1',
                url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
                link: 'goemon-products.html',
                alt: '2025 SPRING COLLECTION',
                title: '春の新作コレクション入荷',
                order: 0
            },
            {
                id: 'hero2',
                url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
                link: 'goemon-products.html',
                alt: 'SALE MAX 70% OFF',
                title: '春夏アイテムがお買い得',
                order: 1
            },
            {
                id: 'hero3',
                url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
                link: 'goemon-register.html',
                alt: 'NEW MEMBER CAMPAIGN',
                title: '新規登録で500円クーポン',
                order: 2
            }
        ];
        localStorage.setItem('goemonheroimages', JSON.stringify(defaultHeroImages));

        // バージョンフラグをセット
        localStorage.setItem('goemonSettingsVersion', currentVersion);

        console.log('Default data initialized - Version:', currentVersion);
    }
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

// ログアウト
window.logout = function() {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminId');
    window.location.href = 'goemon-admin-login.html';
}

// タブ切り替え
window.switchTab = function(tabName) {
    // すべてのタブとコンテンツを非アクティブに
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 選択されたタブとコンテンツをアクティブに
    if (tabName === 'categories') {
        document.querySelectorAll('.settings-tab')[0].classList.add('active');
        document.getElementById('categoriesTab').classList.add('active');
    } else if (tabName === 'productTypes') {
        document.querySelectorAll('.settings-tab')[1].classList.add('active');
        document.getElementById('productTypesTab').classList.add('active');
    } else if (tabName === 'hero') {
        document.querySelectorAll('.settings-tab')[2].classList.add('active');
        document.getElementById('heroTab').classList.add('active');
    } else if (tabName === 'system') {
        document.querySelectorAll('.settings-tab')[3].classList.add('active');
        document.getElementById('systemTab').classList.add('active');
    }
}

// ========================================
// カテゴリ管理
// ========================================

// カテゴリデータを読み込み(Supabaseから)
async function loadCategories() {
    try {
        const data = await fetchAllCategories();
        categories = data.map(dbCat => ({
            id: dbCat.id,
            name: dbCat.name,
            slug: dbCat.slug || dbCat.name,
            description: dbCat.description || '',
            order: dbCat.display_order
        }));

        console.log('Loaded categories from Supabase:', categories.length);
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        showAlertModal('カテゴリデータの読み込みに失敗しました', 'error');
    }
}

// カテゴリを表示
function renderCategories() {
    const list = document.getElementById('categoriesList');

    if (categories.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3 style="margin-bottom: 10px;">カテゴリがありません</h3>
                <p>「カテゴリを追加」ボタンから追加してください</p>
            </div>
        `;
        return;
    }

    // 並び順でソート
    categories.sort((a, b) => a.order - b.order);

    list.innerHTML = categories.map(category => `
        <div class="category-item" data-id="${category.id}">
            <div class="category-drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="category-info">
                <h3>${category.name}</h3>
                <p>${category.description || '説明なし'}</p>
                <span class="category-slug">${category.slug}</span>
            </div>
            <div class="category-actions">
                <button class="btn-small btn-edit" onclick="editCategory('${category.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteCategory('${category.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');

    // Sortable.jsを適用
    new Sortable(list, {
        animation: 150,
        handle: '.category-drag-handle',
        onEnd: updateCategoryOrder
    });
}

// カテゴリ順序を更新(Supabaseに保存)
async function updateCategoryOrder() {
    const items = document.querySelectorAll('.category-item');

    try {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const id = item.dataset.id;
            const category = categories.find(c => c.id === id);
            if (category) {
                category.order = index;
                // Supabaseに順序を更新
                await updateCategoryOrder_DB(id, index);
            }
        }

        showAlertModal('並び順を更新しました', 'success');
    } catch (error) {
        console.error('並び順更新エラー:', error);
        showAlertModal('並び順の更新に失敗しました: ' + error.message, 'error');
    }
}

// カテゴリ追加モーダルを開く
window.openAddCategoryModal = function() {
    console.log('openAddCategoryModal called');
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-plus"></i> カテゴリを追加';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';

    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'flex';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
        console.log('Category modal opened');
    } else {
        console.error('Category modal not found');
    }
}

// カテゴリ編集モーダルを開く
window.editCategory = function(id) {
    console.log('editCategory called with id:', id);
    const category = categories.find(c => c.id === id);

    if (!category) {
        console.error('Category not found:', id);
        showAlertModal('カテゴリが見つかりません', 'error');
        return;
    }

    editingCategoryId = id;

    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-edit"></i> カテゴリを編集';
    document.getElementById('categoryId').value = id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySlug').value = category.slug;
    document.getElementById('categoryDescription').value = category.description || '';

    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'flex';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
        console.log('Category edit modal opened');
    } else {
        console.error('Category modal not found');
    }
}

// カテゴリフォーム送信処理(Supabaseに保存)
async function handleCategoryFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    // バリデーション
    if (!name) {
        showAlertModal('カテゴリ名を入力してください', 'warning');
        return;
    }

    if (!slug) {
        showAlertModal('スラッグを入力してください', 'warning');
        return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
        showAlertModal('スラッグは半角英数字とハイフンのみ使用可能です', 'warning');
        return;
    }

    // 重複チェック
    const duplicateSlug = categories.find(c => c.slug === slug && c.id !== editingCategoryId);
    if (duplicateSlug) {
        showAlertModal('このスラッグは既に使用されています', 'warning');
        return;
    }

    try {
        if (editingCategoryId) {
            // 編集モード - Supabaseを更新
            await updateCategory_DB(editingCategoryId, name, slug, description);
            showAlertModal('カテゴリを更新しました', 'success');
        } else {
            // 新規追加モード - Supabaseに追加
            await addCategory_DB(name, slug, description, categories.length);
            showAlertModal('カテゴリを追加しました', 'success');
        }

        // モーダルを閉じる
        closeCategoryModal();

        // カテゴリリストを再読み込み
        await loadCategories();
    } catch (error) {
        console.error('カテゴリ保存エラー:', error);
        showAlertModal('カテゴリの保存に失敗しました: ' + error.message, 'error');
    }
}

// カテゴリを削除(Supabaseから削除)
window.deleteCategory = function(id) {
    const category = categories.find(c => c.id === id);

    if (!category) {
        showAlertModal('カテゴリが見つかりません', 'error');
        return;
    }

    showConfirmModal(
        `カテゴリ「${category.name}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
        async () => {
            try {
                // Supabaseから削除
                await window.deleteCategoryFromDB(id);

                showAlertModal('カテゴリを削除しました', 'success');
                await loadCategories();
            } catch (error) {
                console.error('カテゴリ削除エラー:', error);
                showAlertModal('カテゴリの削除に失敗しました: ' + error.message, 'error');
            }
        }
    );
}

// カテゴリモーダルを閉じる
window.closeCategoryModal = function() {
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'none';
    const container = modal.querySelector('.modal-cmn-container');
    if (container) {
        container.classList.remove('active');
    }
    document.getElementById('categoryForm').reset();
    editingCategoryId = null;
}

// ========================================
// 商品タイプ管理
// ========================================

// 商品タイプを読み込み(Supabaseから)
async function loadProductTypes() {
    try {
        const data = await fetchAllProductTypes();
        productTypes = data.map(dbType => ({
            id: dbType.id,
            name: dbType.name,
            slug: dbType.slug || dbType.name,
            description: dbType.description || '',
            tag: dbType.tag || '',
            tagColor: dbType.tag_color || 'blue',
            order: dbType.display_order
        }));

        console.log('Loaded product types from Supabase:', productTypes.length);
        renderProductTypes();
    } catch (error) {
        console.error('Error loading product types:', error);
        showAlertModal('商品タイプの読み込みに失敗しました', 'error');
    }
}

// 商品タイプを表示
function renderProductTypes() {
    const list = document.getElementById('productTypesList');
    if (!list) return;

    list.innerHTML = '';

    if (productTypes.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">商品タイプがありません</p>';
        return;
    }

    // 並び順でソート
    productTypes.sort((a, b) => a.order - b.order);

    productTypes.forEach(type => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.dataset.id = type.id;

        item.innerHTML = `
            <i class="fas fa-grip-vertical category-drag-handle"></i>
            <div style="flex: 1;">
                <h4 style="font-size: 16px; margin-bottom: 5px;">${type.name}</h4>
                <p style="color: #666; font-size: 14px; margin: 0;">${type.description || 'スラッグ: ' + type.slug}</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-icon" onclick="editProductType('${type.id}')" title="編集">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-icon-delete" onclick="deleteProductType('${type.id}')" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        list.appendChild(item);
    });

    // 既存のSortableインスタンスを破棄してから再作成
    if (list.sortableInstance) {
        list.sortableInstance.destroy();
    }

    // Sortable.jsを適用
    list.sortableInstance = new Sortable(list, {
        animation: 150,
        handle: '.category-drag-handle',
        onEnd: updateProductTypeOrder
    });
}

// 商品タイプ順序を更新(Supabaseに保存)
async function updateProductTypeOrder() {
    const items = document.querySelectorAll('#productTypesList .category-item');

    try {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const id = item.dataset.id;
            const type = productTypes.find(t => t.id === id);
            if (type) {
                type.order = index;
                // Supabaseに順序を更新
                await updateProductTypeOrder_DB(id, index);
            }
        }

        showAlertModal('並び順を更新しました', 'success');
    } catch (error) {
        console.error('並び順更新エラー:', error);
        showAlertModal('並び順の更新に失敗しました: ' + error.message, 'error');
    }
}

// 商品タイプ追加モーダルを開く
window.openAddProductTypeModal = function() {
    console.log('openAddProductTypeModal called');
    editingProductTypeId = null;
    document.getElementById('productTypeModalTitle').innerHTML = '<i class="fas fa-plus"></i> 商品タイプを追加';
    document.getElementById('productTypeForm').reset();
    document.getElementById('productTypeId').value = '';

    const modal = document.getElementById('productTypeModal');
    if (modal) {
        modal.style.display = 'flex';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
        console.log('Product type modal opened');
    } else {
        console.error('Product type modal not found');
    }
}

// 商品タイプ編集モーダルを開く
window.editProductType = function(id) {
    console.log('editProductType called with id:', id);
    const type = productTypes.find(t => t.id === id);

    if (!type) {
        console.error('Product type not found:', id);
        showAlertModal('商品タイプが見つかりません', 'error');
        return;
    }

    editingProductTypeId = id;

    document.getElementById('productTypeModalTitle').innerHTML = '<i class="fas fa-edit"></i> 商品タイプを編集';
    document.getElementById('productTypeId').value = id;
    document.getElementById('productTypeName').value = type.name;
    document.getElementById('productTypeSlug').value = type.slug;
    document.getElementById('productTypeDescription').value = type.description || '';
    document.getElementById('productTypeTag').value = type.tag || '';
    document.getElementById('productTypeTagColor').value = type.tagColor || 'blue';

    const modal = document.getElementById('productTypeModal');
    if (modal) {
        modal.style.display = 'flex';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
        console.log('Product type edit modal opened');
    } else {
        console.error('Product type modal not found');
    }
}

// 商品タイプフォーム送信処理(Supabaseに保存)
async function handleProductTypeFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('productTypeName').value.trim();
    const slug = document.getElementById('productTypeSlug').value.trim();
    const description = document.getElementById('productTypeDescription').value.trim();
    const tag = document.getElementById('productTypeTag').value.trim();
    const tagColor = document.getElementById('productTypeTagColor').value;

    // バリデーション
    if (!name || !slug) {
        showAlertModal('必須項目を入力してください', 'warning');
        return;
    }

    // スラッグの重複チェック
    const existingType = productTypes.find(t => t.slug === slug && t.id !== editingProductTypeId);
    if (existingType) {
        showAlertModal('このスラッグは既に使用されています', 'warning');
        return;
    }

    try {
        if (editingProductTypeId) {
            // 編集モード - Supabaseを更新
            await updateProductType_DB(editingProductTypeId, name, slug, description, tag, tagColor);
            showAlertModal('商品タイプを更新しました', 'success');
        } else {
            // 新規追加モード - Supabaseに追加
            await addProductType_DB(name, slug, description, tag, tagColor, productTypes.length);
            showAlertModal('商品タイプを追加しました', 'success');
        }

        // モーダルを閉じる
        closeProductTypeModal();

        // 商品タイプリストを再読み込み
        await loadProductTypes();
    } catch (error) {
        console.error('商品タイプ保存エラー:', error);
        showAlertModal('商品タイプの保存に失敗しました: ' + error.message, 'error');
    }
}

// 商品タイプを削除(Supabaseから削除)
window.deleteProductType = function(id) {
    const type = productTypes.find(t => t.id === id);

    if (!type) {
        showAlertModal('商品タイプが見つかりません', 'error');
        return;
    }

    showConfirmModal(
        `「${type.name}」を削除してもよろしいですか？`,
        async function() {
            try {
                // Supabaseから削除
                await window.deleteProductTypeFromDB(id);

                showAlertModal('商品タイプを削除しました', 'success');
                await loadProductTypes();
            } catch (error) {
                console.error('商品タイプ削除エラー:', error);
                showAlertModal('商品タイプの削除に失敗しました: ' + error.message, 'error');
            }
        }
    );
}

// 商品タイプモーダルを閉じる
window.closeProductTypeModal = function() {
    const modal = document.getElementById('productTypeModal');
    modal.style.display = 'none';
    const container = modal.querySelector('.modal-cmn-container');
    if (container) {
        container.classList.remove('active');
    }
    document.getElementById('productTypeForm').reset();
    editingProductTypeId = null;
}

// ========================================
// ヒーロー画像管理
// ========================================

// ヒーロー画像データを読み込み
async function loadHeroImages() {
    try {
        const data = await window.fetchAllHeroImages();
        heroImages = data.map(dbImage => ({
            id: dbImage.id,
            url: dbImage.image_url,
            link: dbImage.link_url,
            alt: dbImage.title || '',
            title: dbImage.subtitle || dbImage.title || '',
            order: dbImage.display_order
        }));

        console.log('Loaded hero images from Supabase:', heroImages.length);
        renderHeroImages();
    } catch (error) {
        console.error('Error loading hero images:', error);
        showAlertModal('ヒーロー画像データの読み込みに失敗しました', 'error');
    }
}

// ヒーロー画像を表示
function renderHeroImages() {
    const list = document.getElementById('heroImagesList');

    if (heroImages.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-image"></i>
                <h3 style="margin-bottom: 10px;">ヒーロー画像がありません</h3>
                <p>「画像を追加」ボタンから追加してください</p>
            </div>
        `;
        return;
    }

    // 並び順でソート
    heroImages.sort((a, b) => a.order - b.order);

    list.innerHTML = heroImages.map((image, index) => `
        <div class="hero-image-item" data-id="${image.id}">
            <div class="hero-drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="hero-image-preview">
                <img src="${image.url}" alt="${image.alt}" onerror="this.src='https://via.placeholder.com/300x150?text=Image+Not+Found'">
            </div>
            <div class="hero-image-info">
                <h3>${image.title || image.alt}</h3>
                <p><strong>代替テキスト:</strong> ${image.alt}</p>
                ${image.link ? `<p><strong>リンク先:</strong> ${image.link}</p>` : ''}
                <span class="hero-image-order">表示順: ${index + 1}</span>
            </div>
            <div class="hero-image-actions">
                <button class="btn-small btn-edit" data-action="edit" data-image-id="${image.id}">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" data-action="delete" data-image-id="${image.id}">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');

    // Sortable.jsを適用
    new Sortable(list, {
        animation: 150,
        handle: '.hero-drag-handle',
        onEnd: updateHeroImageOrder
    });

    // ボタンのイベントリスナーを追加
    list.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action;
            const imageId = this.dataset.imageId;

            if (action === 'edit') {
                window.editHeroImage(imageId);
            } else if (action === 'delete') {
                window.deleteHeroImage(imageId);
            }
        });
    });
}

// ヒーロー画像順序を更新
async function updateHeroImageOrder() {
    const items = document.querySelectorAll('.hero-image-item');

    try {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const id = item.dataset.id;
            const image = heroImages.find(img => String(img.id) === String(id));
            if (image) {
                image.order = index;
                // Supabaseに順序を更新
                await window.updateHeroImage(id, {
                    imageUrl: image.url,
                    title: image.alt,
                    subtitle: image.title,
                    linkUrl: image.link,
                    displayOrder: index,
                    isActive: true
                });
            }
        }

        showAlertModal('並び順を更新しました', 'success');
        renderHeroImages(); // 表示順を更新するため再レンダリング
    } catch (error) {
        console.error('順序更新エラー:', error);
        showAlertModal('並び順の更新に失敗しました: ' + error.message, 'error');
    }
}

// ヒーロー画像追加モーダルを開く
window.openAddHeroImageModal = function() {
    console.log('openAddHeroImageModal called');
    editingHeroImageId = null;
    document.getElementById('heroImageModalTitle').innerHTML = '<i class="fas fa-plus"></i> ヒーロー画像を追加';
    document.getElementById('heroImageForm').reset();
    document.getElementById('heroImageId').value = '';

    const modal = document.getElementById('heroImageModal');
    if (modal) {
        modal.style.display = 'flex';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
        console.log('Hero image modal opened');
    } else {
        console.error('Hero image modal not found');
    }
}

// ヒーロー画像編集モーダルを開く
window.editHeroImage = function(id) {
    // IDをそのまま使用（UUIDまたは数値の可能性があるため、文字列として比較）
    const searchId = String(id);
    const image = heroImages.find(img => String(img.id) === searchId);

    if (!image) {
        console.error('Hero image not found:', id);
        showAlertModal('画像が見つかりません', 'error');
        return;
    }

    editingHeroImageId = searchId;

    document.getElementById('heroImageModalTitle').innerHTML = '<i class="fas fa-edit"></i> ヒーロー画像を編集';
    document.getElementById('heroImageId').value = id;
    document.getElementById('heroImageUrl').value = image.url;
    document.getElementById('heroImageLink').value = image.link || '';
    document.getElementById('heroImageAlt').value = image.alt;

    const modal = document.getElementById('heroImageModal');
    if (modal) {
        modal.style.display = 'flex';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
        console.log('Hero image edit modal opened');
    } else {
        console.error('Hero image modal not found');
    }
}

// ヒーロー画像フォーム送信処理
async function handleHeroImageFormSubmit(e) {
    e.preventDefault();

    const url = document.getElementById('heroImageUrl').value.trim();
    const link = document.getElementById('heroImageLink').value.trim();
    const alt = document.getElementById('heroImageAlt').value.trim();
    const title = alt; // 代替テキストをサブタイトルとして使用

    // バリデーション
    if (!url) {
        showAlertModal('画像URLを入力してください', 'warning');
        return;
    }

    if (!alt) {
        showAlertModal('代替テキストを入力してください', 'warning');
        return;
    }

    try {
        if (editingHeroImageId) {
            // 編集モード
            const index = heroImages.findIndex(img => String(img.id) === String(editingHeroImageId));
            if (index !== -1) {
                heroImages[index] = {
                    ...heroImages[index],
                    url,
                    link,
                    alt,
                    title
                };

                // Supabaseに更新
                await window.updateHeroImage(editingHeroImageId, {
                    imageUrl: url,
                    title: alt,
                    subtitle: title,
                    linkUrl: link,
                    displayOrder: heroImages[index].order,
                    isActive: true
                });
            }
            showAlertModal('ヒーロー画像を更新しました', 'success');
        } else {
            // 新規追加モード
            const newImage = {
                id: generateId(),
                url,
                link,
                alt,
                title,
                order: heroImages.length
            };

            // Supabaseに追加
            const result = await window.addHeroImage({
                imageUrl: url,
                title: alt,
                subtitle: title,
                linkUrl: link,
                displayOrder: newImage.order,
                isActive: true
            });

            // 返ってきたIDを設定
            newImage.id = result.id;
            heroImages.push(newImage);
            showAlertModal('ヒーロー画像を追加しました', 'success');
        }

        // モーダルを閉じる
        closeHeroImageModal();

        // ヒーロー画像リストを再表示
        renderHeroImages();
    } catch (error) {
        console.error('ヒーロー画像保存エラー:', error);
        showAlertModal('ヒーロー画像の保存に失敗しました: ' + error.message, 'error');
    }
}

// ヒーロー画像を削除
window.deleteHeroImage = function(id) {
    // IDをそのまま使用（UUIDまたは数値の可能性があるため、文字列として比較）
    const searchId = String(id);
    const image = heroImages.find(img => String(img.id) === searchId);

    if (!image) {
        showAlertModal('画像が見つかりません', 'error');
        return;
    }

    showConfirmModal(
        `ヒーロー画像「${image.title || image.alt}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
        async () => {
            try {
                // Supabaseから削除
                await window.deleteHeroImageFromDB(searchId);

                heroImages = heroImages.filter(img => String(img.id) !== searchId);
                showAlertModal('ヒーロー画像を削除しました', 'success');
                renderHeroImages();
            } catch (error) {
                console.error('ヒーロー画像削除エラー:', error);
                showAlertModal('ヒーロー画像の削除に失敗しました: ' + error.message, 'error');
            }
        }
    );
}

// ヒーロー画像モーダルを閉じる
window.closeHeroImageModal = function() {
    const modal = document.getElementById('heroImageModal');
    modal.style.display = 'none';
    const container = modal.querySelector('.modal-cmn-container');
    if (container) {
        container.classList.remove('active');
    }
    document.getElementById('heroImageForm').reset();
    editingHeroImageId = null;
}

// ========================================
// ユーティリティ
// ========================================

// IDを生成
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 画像アップロード機能を初期化
function initializeImageUploads() {
    // 画像アップロードライブラリが読み込まれているか確認
    if (typeof setupFileInput !== 'function') {
        console.warn('Image upload library not loaded');
        return;
    }

    // ヒーロー画像のファイル入力を設定
    setupFileInput('heroImageFile', 'heroImagePreview', 'heroImageUrl');

    console.log('Image upload functionality initialized for hero images');
}

// ========================================
// システム設定管理
// ========================================

/**
 * システム設定を読み込み
 */
async function loadSystemSettings() {
    try {
        // ポイント付与レートを取得
        const pointRateSetting = await fetchSiteSetting('point_award_rate');
        const pointRate = pointRateSetting ? parseInt(pointRateSetting.value) : 500;

        // フォームに値をセット
        const pointRateInput = document.getElementById('pointAwardRate');
        const currentPointRateSpan = document.getElementById('currentPointRate');

        if (pointRateInput) {
            pointRateInput.value = pointRate;
        }
        if (currentPointRateSpan) {
            currentPointRateSpan.textContent = pointRate;
        }

        console.log('システム設定を読み込みました:', { pointRate });
    } catch (error) {
        console.error('システム設定読み込みエラー:', error);
        // エラー時はデフォルト値を設定
        const pointRateInput = document.getElementById('pointAwardRate');
        if (pointRateInput) {
            pointRateInput.value = 500;
        }
    }
}

/**
 * ポイント設定フォーム送信処理
 */
async function handlePointSettingsFormSubmit(e) {
    e.preventDefault();

    const pointRate = parseInt(document.getElementById('pointAwardRate').value);

    // バリデーション
    if (!pointRate || pointRate < 1 || pointRate > 10000) {
        showAlertModal('ポイント付与レートは1〜10000の範囲で入力してください', 'warning');
        return;
    }

    try {
        // サイト設定を更新
        await updateSiteSetting('point_award_rate', pointRate.toString());

        // 現在の設定表示を更新
        const currentPointRateSpan = document.getElementById('currentPointRate');
        if (currentPointRateSpan) {
            currentPointRateSpan.textContent = pointRate;
        }

        showAlertModal(`ポイント付与レートを更新しました（${pointRate}円 = 1pt）`, 'success');
        console.log('ポイント付与レート更新:', pointRate);
    } catch (error) {
        console.error('ポイント設定保存エラー:', error);
        showAlertModal('設定の保存に失敗しました: ' + error.message, 'error');
    }
}

// モーダル外クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
    const categoryModal = document.getElementById('categoryModal');
    const heroImageModal = document.getElementById('heroImageModal');

    if (categoryModal) {
        categoryModal.addEventListener('click', function(e) {
            if (e.target === categoryModal) {
                closeCategoryModal();
            }
        });
    }

    if (heroImageModal) {
        heroImageModal.addEventListener('click', function(e) {
            if (e.target === heroImageModal) {
                closeHeroImageModal();
            }
        });
    }
});
