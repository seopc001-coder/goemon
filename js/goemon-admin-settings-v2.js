// ===================================
// 五右衛門 ECサイト - 設定管理 (Supabase版)
// ===================================

console.log('goemon-admin-settings-v2.js loaded');

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

    // Supabaseからデータを読み込み
    await loadCategories();
    await loadProductTypes();
    await loadHeroImages();

    // フォーム送信イベント
    document.getElementById('categoryForm').addEventListener('submit', handleCategoryFormSubmit);
    document.getElementById('productTypeForm').addEventListener('submit', handleProductTypeFormSubmit);
    document.getElementById('heroImageForm').addEventListener('submit', handleHeroImageFormSubmit);

    // 画像アップロード機能を初期化
    initializeImageUploads();

    console.log('initializeSettings completed');
}

// ===================================
// カテゴリー管理
// ===================================

/**
 * カテゴリデータを読み込み
 */
async function loadCategories() {
    try {
        console.log('📥 Supabaseからカテゴリーを取得中...');
        categories = await fetchAllCategories();
        console.log('✅ カテゴリー取得完了:', categories.length, '件');
        renderCategories();
    } catch (error) {
        console.error('カテゴリー読み込みエラー:', error);
        showAlertModal('カテゴリデータの読み込みに失敗しました', 'error');
    }
}

/**
 * カテゴリを表示
 */
function renderCategories() {
    const list = document.getElementById('categoriesList');

    if (!categories || categories.length === 0) {
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
    categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    list.innerHTML = categories.map(category => `
        <div class="category-item" data-id="${category.id}">
            <div class="category-drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="category-info">
                <h3>${category.name}</h3>
                <span class="category-badge">表示順: ${category.display_order || 0}</span>
            </div>
            <div class="category-actions">
                <button class="btn-small btn-edit" onclick="editCategory('${category.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="confirmDeleteCategory('${category.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * カテゴリ追加モーダルを開く
 */
window.openAddCategoryModal = function() {
    console.log('openAddCategoryModal called');
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-plus"></i> カテゴリを追加';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryOrder').value = categories.length;

    const modal = document.getElementById('categoryModal');
    modal.style.display = 'flex';
};

/**
 * カテゴリ編集モーダルを開く
 */
window.editCategory = function(categoryId) {
    console.log('editCategory called:', categoryId);
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        showAlertModal('カテゴリが見つかりません', 'error');
        return;
    }

    editingCategoryId = categoryId;
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-edit"></i> カテゴリを編集';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryOrder').value = category.display_order || 0;

    const modal = document.getElementById('categoryModal');
    modal.style.display = 'flex';
};

/**
 * カテゴリフォーム送信処理
 */
async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    console.log('handleCategoryFormSubmit called');

    const name = document.getElementById('categoryName').value.trim();
    const displayOrder = parseInt(document.getElementById('categoryOrder').value) || 0;

    if (!name) {
        showAlertModal('カテゴリ名を入力してください', 'error');
        return;
    }

    try {
        if (editingCategoryId) {
            // 更新
            console.log('🔄 カテゴリーを更新中...', editingCategoryId);
            await updateCategory(editingCategoryId, name, displayOrder);
            showAlertModal('カテゴリを更新しました', 'success');
        } else {
            // 新規追加
            console.log('➕ カテゴリーを追加中...');
            await addCategory(name, displayOrder);
            showAlertModal('カテゴリを追加しました', 'success');
        }

        closeCategoryModal();
        await loadCategories();
    } catch (error) {
        console.error('カテゴリー保存エラー:', error);
        showAlertModal('カテゴリの保存に失敗しました: ' + error.message, 'error');
    }
}

/**
 * カテゴリ削除確認
 */
window.confirmDeleteCategory = async function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (!confirm(`カテゴリ「${category.name}」を削除してもよろしいですか？\n\nこのカテゴリを使用している商品は影響を受けます。`)) {
        return;
    }

    try {
        console.log('🗑️ カテゴリーを削除中...', categoryId);
        await deleteCategory(categoryId);
        showAlertModal('カテゴリを削除しました', 'success');
        await loadCategories();
    } catch (error) {
        console.error('カテゴリー削除エラー:', error);
        showAlertModal('カテゴリの削除に失敗しました: ' + error.message, 'error');
    }
};

/**
 * カテゴリ更新（Supabase）
 */
async function updateCategory(categoryId, name, displayOrder) {
    const { data, error } = await supabase
        .from('categories')
        .update({
            name: name,
            display_order: displayOrder
        })
        .eq('id', categoryId)
        .select();

    if (error) throw error;
    return data[0];
}

/**
 * カテゴリモーダルを閉じる
 */
function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    editingCategoryId = null;
}

// ===================================
// 商品タイプ管理
// ===================================

/**
 * 商品タイプデータを読み込み
 */
async function loadProductTypes() {
    try {
        console.log('📥 Supabaseから商品タイプを取得中...');
        productTypes = await fetchAllProductTypes();
        console.log('✅ 商品タイプ取得完了:', productTypes.length, '件');
        renderProductTypes();
    } catch (error) {
        console.error('商品タイプ読み込みエラー:', error);
        showAlertModal('商品タイプデータの読み込みに失敗しました', 'error');
    }
}

/**
 * 商品タイプを表示
 */
function renderProductTypes() {
    const list = document.getElementById('productTypesList');

    if (!productTypes || productTypes.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tag"></i>
                <h3 style="margin-bottom: 10px;">商品タイプがありません</h3>
                <p>「商品タイプを追加」ボタンから追加してください</p>
            </div>
        `;
        return;
    }

    // 並び順でソート
    productTypes.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    list.innerHTML = productTypes.map(type => `
        <div class="product-type-item" data-id="${type.id}">
            <div class="product-type-drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="product-type-info">
                <h3>${type.name}</h3>
                <span class="category-badge">表示順: ${type.display_order || 0}</span>
            </div>
            <div class="product-type-actions">
                <button class="btn-small btn-edit" onclick="editProductType('${type.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="confirmDeleteProductType('${type.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * 商品タイプ追加モーダルを開く
 */
window.openAddProductTypeModal = function() {
    console.log('openAddProductTypeModal called');
    editingProductTypeId = null;
    document.getElementById('productTypeModalTitle').innerHTML = '<i class="fas fa-plus"></i> 商品タイプを追加';
    document.getElementById('productTypeForm').reset();
    document.getElementById('productTypeName').value = '';
    document.getElementById('productTypeOrder').value = productTypes.length;

    const modal = document.getElementById('productTypeModal');
    modal.style.display = 'flex';
};

/**
 * 商品タイプ編集モーダルを開く
 */
window.editProductType = function(typeId) {
    console.log('editProductType called:', typeId);
    const type = productTypes.find(t => t.id === typeId);
    if (!type) {
        showAlertModal('商品タイプが見つかりません', 'error');
        return;
    }

    editingProductTypeId = typeId;
    document.getElementById('productTypeModalTitle').innerHTML = '<i class="fas fa-edit"></i> 商品タイプを編集';
    document.getElementById('productTypeName').value = type.name;
    document.getElementById('productTypeOrder').value = type.display_order || 0;

    const modal = document.getElementById('productTypeModal');
    modal.style.display = 'flex';
};

/**
 * 商品タイプフォーム送信処理
 */
async function handleProductTypeFormSubmit(e) {
    e.preventDefault();
    console.log('handleProductTypeFormSubmit called');

    const name = document.getElementById('productTypeName').value.trim();
    const displayOrder = parseInt(document.getElementById('productTypeOrder').value) || 0;

    if (!name) {
        showAlertModal('商品タイプ名を入力してください', 'error');
        return;
    }

    try {
        if (editingProductTypeId) {
            // 更新
            console.log('🔄 商品タイプを更新中...', editingProductTypeId);
            await updateProductType(editingProductTypeId, name, displayOrder);
            showAlertModal('商品タイプを更新しました', 'success');
        } else {
            // 新規追加
            console.log('➕ 商品タイプを追加中...');
            await addProductType(name, displayOrder);
            showAlertModal('商品タイプを追加しました', 'success');
        }

        closeProductTypeModal();
        await loadProductTypes();
    } catch (error) {
        console.error('商品タイプ保存エラー:', error);
        showAlertModal('商品タイプの保存に失敗しました: ' + error.message, 'error');
    }
}

/**
 * 商品タイプ削除確認
 */
window.confirmDeleteProductType = async function(typeId) {
    const type = productTypes.find(t => t.id === typeId);
    if (!type) return;

    if (!confirm(`商品タイプ「${type.name}」を削除してもよろしいですか？\n\nこの商品タイプを使用している商品は影響を受けます。`)) {
        return;
    }

    try {
        console.log('🗑️ 商品タイプを削除中...', typeId);
        await deleteProductType(typeId);
        showAlertModal('商品タイプを削除しました', 'success');
        await loadProductTypes();
    } catch (error) {
        console.error('商品タイプ削除エラー:', error);
        showAlertModal('商品タイプの削除に失敗しました: ' + error.message, 'error');
    }
};

/**
 * 商品タイプ更新（Supabase）
 */
async function updateProductType(typeId, name, displayOrder) {
    const { data, error } = await supabase
        .from('product_types')
        .update({
            name: name,
            display_order: displayOrder
        })
        .eq('id', typeId)
        .select();

    if (error) throw error;
    return data[0];
}

/**
 * 商品タイプモーダルを閉じる
 */
function closeProductTypeModal() {
    document.getElementById('productTypeModal').style.display = 'none';
    editingProductTypeId = null;
}

// ===================================
// ヒーロー画像管理
// ===================================

/**
 * ヒーロー画像データを読み込み
 */
async function loadHeroImages() {
    try {
        console.log('📥 Supabaseからヒーロー画像を取得中...');
        heroImages = await fetchAllHeroImages();
        console.log('✅ ヒーロー画像取得完了:', heroImages.length, '件');
        renderHeroImages();
    } catch (error) {
        console.error('ヒーロー画像読み込みエラー:', error);
        showAlertModal('ヒーロー画像データの読み込みに失敗しました', 'error');
    }
}

/**
 * ヒーロー画像を表示
 */
function renderHeroImages() {
    const list = document.getElementById('heroImagesList');

    if (!heroImages || heroImages.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-image"></i>
                <h3 style="margin-bottom: 10px;">ヒーロー画像がありません</h3>
                <p>「ヒーロー画像を追加」ボタンから追加してください</p>
            </div>
        `;
        return;
    }

    // 並び順でソート
    heroImages.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    list.innerHTML = heroImages.map(image => `
        <div class="hero-image-item" data-id="${image.id}">
            <div class="hero-image-preview">
                ${image.image_url ? `<img src="${image.image_url}" alt="Hero Image">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
            </div>
            <div class="hero-image-info">
                <h3>画像 #${image.display_order || 0}</h3>
                <p class="hero-image-url">${image.image_url || 'URLなし'}</p>
                ${image.link_url ? `<p class="hero-link-url">リンク: ${image.link_url}</p>` : ''}
                <span class="category-badge ${image.is_active ? 'badge-active' : 'badge-inactive'}">
                    ${image.is_active ? '有効' : '無効'}
                </span>
            </div>
            <div class="hero-image-actions">
                <button class="btn-small btn-edit" onclick="editHeroImage('${image.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="confirmDeleteHeroImage('${image.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * ヒーロー画像追加モーダルを開く
 */
window.openAddHeroImageModal = function() {
    console.log('openAddHeroImageModal called');
    editingHeroImageId = null;
    document.getElementById('heroImageModalTitle').innerHTML = '<i class="fas fa-plus"></i> ヒーロー画像を追加';
    document.getElementById('heroImageForm').reset();
    document.getElementById('heroImageUrl').value = '';
    document.getElementById('heroImageLink').value = '';
    document.getElementById('heroImageOrder').value = heroImages.length;
    document.getElementById('heroImageActive').checked = true;

    const modal = document.getElementById('heroImageModal');
    modal.style.display = 'flex';
};

/**
 * ヒーロー画像編集モーダルを開く
 */
window.editHeroImage = function(imageId) {
    console.log('editHeroImage called:', imageId);
    const image = heroImages.find(img => img.id === imageId);
    if (!image) {
        showAlertModal('ヒーロー画像が見つかりません', 'error');
        return;
    }

    editingHeroImageId = imageId;
    document.getElementById('heroImageModalTitle').innerHTML = '<i class="fas fa-edit"></i> ヒーロー画像を編集';
    document.getElementById('heroImageUrl').value = image.image_url || '';
    document.getElementById('heroImageLink').value = image.link_url || '';
    document.getElementById('heroImageOrder').value = image.display_order || 0;
    document.getElementById('heroImageActive').checked = image.is_active !== false;

    const modal = document.getElementById('heroImageModal');
    modal.style.display = 'flex';
};

/**
 * ヒーロー画像フォーム送信処理
 */
async function handleHeroImageFormSubmit(e) {
    e.preventDefault();
    console.log('handleHeroImageFormSubmit called');

    const imageUrl = document.getElementById('heroImageUrl').value.trim();
    const linkUrl = document.getElementById('heroImageLink').value.trim();
    const displayOrder = parseInt(document.getElementById('heroImageOrder').value) || 0;
    const isActive = document.getElementById('heroImageActive').checked;

    if (!imageUrl) {
        showAlertModal('画像URLを入力してください', 'error');
        return;
    }

    try {
        const heroImageData = {
            imageUrl: imageUrl,
            linkUrl: linkUrl || null,
            displayOrder: displayOrder,
            isActive: isActive
        };

        if (editingHeroImageId) {
            // 更新
            console.log('🔄 ヒーロー画像を更新中...', editingHeroImageId);
            await updateHeroImage(editingHeroImageId, heroImageData);
            showAlertModal('ヒーロー画像を更新しました', 'success');
        } else {
            // 新規追加
            console.log('➕ ヒーロー画像を追加中...');
            await addHeroImage(heroImageData);
            showAlertModal('ヒーロー画像を追加しました', 'success');
        }

        closeHeroImageModal();
        await loadHeroImages();
    } catch (error) {
        console.error('ヒーロー画像保存エラー:', error);
        showAlertModal('ヒーロー画像の保存に失敗しました: ' + error.message, 'error');
    }
}

/**
 * ヒーロー画像削除確認
 */
window.confirmDeleteHeroImage = async function(imageId) {
    if (!confirm('このヒーロー画像を削除してもよろしいですか？')) {
        return;
    }

    try {
        console.log('🗑️ ヒーロー画像を削除中...', imageId);
        await deleteHeroImage(imageId);
        showAlertModal('ヒーロー画像を削除しました', 'success');
        await loadHeroImages();
    } catch (error) {
        console.error('ヒーロー画像削除エラー:', error);
        showAlertModal('ヒーロー画像の削除に失敗しました: ' + error.message, 'error');
    }
};

/**
 * ヒーロー画像モーダルを閉じる
 */
function closeHeroImageModal() {
    document.getElementById('heroImageModal').style.display = 'none';
    editingHeroImageId = null;
}

// ===================================
// 画像アップロード機能
// ===================================

function initializeImageUploads() {
    // ヒーロー画像アップロードボタン
    const heroUploadBtn = document.getElementById('heroUploadBtn');
    const heroFileInput = document.getElementById('heroFileInput');

    if (heroUploadBtn && heroFileInput) {
        heroUploadBtn.addEventListener('click', () => heroFileInput.click());
        heroFileInput.addEventListener('change', handleHeroImageUpload);
    }
}

async function handleHeroImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showAlertModal('画像ファイルを選択してください', 'error');
        return;
    }

    try {
        console.log('📤 画像をアップロード中...', file.name);
        const uploadedUrl = await uploadImageToSupabase(file);
        console.log('✅ アップロード完了:', uploadedUrl);

        document.getElementById('heroImageUrl').value = uploadedUrl;
        showAlertModal('画像をアップロードしました', 'success');
    } catch (error) {
        console.error('画像アップロードエラー:', error);
        showAlertModal('画像のアップロードに失敗しました: ' + error.message, 'error');
    }
}

// ===================================
// モーダル制御
// ===================================

// カテゴリーモーダルの閉じるボタン
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close') || e.target.classList.contains('btn-cancel')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
});

// モーダル外クリックで閉じる
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
