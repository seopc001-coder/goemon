// ===================================
// 五右衛門 ECサイト - 設定管理 v3 (シンプル版)
// ===================================

console.log('goemon-admin-settings-v3.js loaded');

let categories = [];
let productTypes = [];
let heroImages = [];
let editingCategoryId = null;
let editingProductTypeId = null;
let editingHeroImageId = null;

// ===================================
// 管理者権限チェック
// ===================================

async function checkAdminAccess() {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated');

    if (adminAuthenticated !== 'true') {
        window.location.href = 'goemon-admin-login.html';
        return;
    }

    const adminNameElem = document.getElementById('adminName');
    const adminId = sessionStorage.getItem('adminId');
    if (adminNameElem && adminId) {
        adminNameElem.textContent = adminId;
    }

    console.log('Admin access granted for:', adminId);
}

// ===================================
// ログアウト
// ===================================

window.logout = function() {
    showConfirmModal('ログアウトしますか？', () => {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminId');
        window.location.href = 'goemon-admin-login.html';
    });
};

// ===================================
// 初期化
// ===================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Settings v3 initialized');

    // 管理者権限チェック
    await checkAdminAccess();

    // データ読み込み
    await Promise.all([
        loadCategories(),
        loadProductTypes(),
        loadHeroImages()
    ]);

    // イベントリスナー設定
    setupEventListeners();
});

function setupEventListeners() {
    console.log('Setting up event listeners...');
    // フォーム送信
    const categoryForm = document.getElementById('categoryForm');
    const productTypeForm = document.getElementById('productTypeForm');
    const heroImageForm = document.getElementById('heroImageForm');

    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
        console.log('✅ Category form listener attached');
    }
    if (productTypeForm) {
        productTypeForm.addEventListener('submit', handleProductTypeSubmit);
        console.log('✅ Product type form listener attached');
    }
    if (heroImageForm) {
        heroImageForm.addEventListener('submit', handleHeroImageSubmit);
        console.log('✅ Hero image form listener attached');
    }

    // ヒーロー画像ファイル選択
    const heroImageFile = document.getElementById('heroImageFile');
    if (heroImageFile) {
        heroImageFile.addEventListener('change', handleHeroImageFileSelect);
        console.log('✅ Hero image file listener attached');
    }
}

// ===================================
// タブ切り替え
// ===================================

window.switchTab = function(tabName) {
    console.log('Switching to tab:', tabName);

    // すべてのタブとコンテンツを非アクティブに
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // モーダルを全て閉じる
    closeAllModals();

    // 選択されたタブとコンテンツをアクティブに
    const tabButtons = document.querySelectorAll('.settings-tab');
    if (tabName === 'categories') {
        tabButtons[0]?.classList.add('active');
        document.getElementById('categoriesTab')?.classList.add('active');
    } else if (tabName === 'productTypes') {
        tabButtons[1]?.classList.add('active');
        document.getElementById('productTypesTab')?.classList.add('active');
    } else if (tabName === 'hero') {
        tabButtons[2]?.classList.add('active');
        document.getElementById('heroTab')?.classList.add('active');
    }
};

function closeAllModals() {
    document.querySelectorAll('.modal-cmn').forEach(modal => {
        modal.style.display = 'none';
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.remove('active');
        }
    });
}

// ===================================
// カテゴリ管理
// ===================================

async function loadCategories() {
    try {
        console.log('🔍 Loading categories...');
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        categories = data || [];
        console.log('📦 Categories loaded:', categories);
        renderCategories();
    } catch (error) {
        console.error('カテゴリ読み込みエラー:', error);
    }
}

function renderCategories() {
    console.log('🎨 Rendering categories...');
    const list = document.getElementById('categoriesList');
    console.log('📋 List element found:', list);
    if (!list) {
        console.error('❌ categoriesList element not found!');
        return;
    }

    // まず既存のコンテンツをクリア
    list.innerHTML = '';
    console.log('🧹 Cleared existing content');

    // JSONフォーマットの残骸を削除
    document.querySelectorAll('.category-item').forEach(item => {
        if (item.textContent.includes('{"display_order"')) {
            console.log('🗑️ Removing malformed JSON element');
            item.remove();
        }
    });

    if (categories.length === 0) {
        console.log('⚠️ No categories to display');
        list.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><p>カテゴリがありません</p></div>';
        return;
    }

    console.log(`✅ Rendering ${categories.length} categories`);
    const html = categories.map(cat => `
        <div class="category-item" data-id="${cat.id}" draggable="true">
            <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
            <div class="category-info">
                <h3>${cat.name}</h3>
                <p>表示順: ${cat.display_order || 0}</p>
            </div>
            <div class="category-actions">
                <button class="btn-small btn-edit" onclick="editCategory('${cat.id}')" draggable="false">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteCategory('${cat.id}')" draggable="false">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');

    list.innerHTML = html;

    // ドラッグ&ドロップイベントを追加
    setupCategoryDragAndDrop();

    // レンダリング後の内容を確認
    console.log('✨ Categories rendered successfully');
    console.log('📄 Actual innerHTML preview:', list.innerHTML.substring(0, 200));
    console.log('🔢 Child elements count:', list.children.length);
}

// カテゴリのドラッグ&ドロップ設定
function setupCategoryDragAndDrop() {
    const items = document.querySelectorAll('#categoriesList .category-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            saveCategoryOrder();
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(document.getElementById('categoriesList'), e.clientY);
            if (afterElement == null) {
                document.getElementById('categoriesList').appendChild(draggedItem);
            } else {
                document.getElementById('categoriesList').insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.category-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveCategoryOrder() {
    const items = document.querySelectorAll('#categoriesList .category-item');
    const updates = [];

    items.forEach((item, index) => {
        const id = item.dataset.id;
        updates.push(
            supabase
                .from('categories')
                .update({ display_order: index })
                .eq('id', id)
        );
    });

    try {
        await Promise.all(updates);
        await loadCategories();
        console.log('✅ Category order saved');
    } catch (error) {
        console.error('カテゴリ順序保存エラー:', error);
        showAlertModal('並び順の保存に失敗しました', 'error');
    }
}

window.openAddCategoryModal = function() {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'カテゴリを追加';
    document.getElementById('categoryForm').reset();
    showModal('categoryModal');
};

window.editCategory = function(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    editingCategoryId = id;
    document.getElementById('categoryModalTitle').textContent = 'カテゴリを編集';
    document.getElementById('categoryName').value = category.name;
    showModal('categoryModal');
};

async function handleCategorySubmit(e) {
    e.preventDefault();
    console.log('handleCategorySubmit called');

    const name = document.getElementById('categoryName').value.trim();

    console.log('Form data:', { name });

    if (!name) {
        showAlertModal('カテゴリ名は必須です', 'error');
        return;
    }

    try {
        if (editingCategoryId) {
            // 更新
            console.log('Updating category:', editingCategoryId);
            const { error } = await supabase
                .from('categories')
                .update({ name })
                .eq('id', editingCategoryId);

            if (error) throw error;
            showAlertModal('カテゴリを更新しました', 'success');
        } else {
            // 新規追加
            console.log('Inserting new category');
            const { error } = await supabase
                .from('categories')
                .insert([{ name, display_order: categories.length }]);

            if (error) throw error;
            showAlertModal('カテゴリを追加しました', 'success');
        }

        closeModal('categoryModal');
        await loadCategories();
    } catch (error) {
        console.error('カテゴリ保存エラー:', error);
        showAlertModal('保存に失敗しました: ' + error.message, 'error');
    }
}

window.deleteCategory = async function(id) {
    showConfirmModal('このカテゴリを削除しますか？', async () => {
        try {
            // goemon-admin-db.jsの削除関数を呼び出し(削除保護ロジック付き)
            await window.deleteCategoryFromDB(id);
            showAlertModal('カテゴリを削除しました', 'success');
            await loadCategories();
        } catch (error) {
            console.error('カテゴリ削除エラー:', error);
            showAlertModal('削除に失敗しました: ' + error.message, 'error');
        }
    });
};

window.closeCategoryModal = function() {
    closeModal('categoryModal');
};

// ===================================
// 商品タイプ管理
// ===================================

async function loadProductTypes() {
    try {
        const { data, error } = await supabase
            .from('product_types')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        productTypes = data || [];
        renderProductTypes();
    } catch (error) {
        console.error('商品タイプ読み込みエラー:', error);
    }
}

function renderProductTypes() {
    const list = document.getElementById('productTypesList');
    if (!list) return;

    if (productTypes.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-box"></i><p>商品タイプがありません</p></div>';
        return;
    }

    list.innerHTML = productTypes.map(type => `
        <div class="product-type-item" data-id="${type.id}" draggable="true">
            <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
            <div class="product-type-info">
                <h3>${type.name}</h3>
                <p>表示順: ${type.display_order || 0}</p>
            </div>
            <div class="product-type-actions">
                <button class="btn-small btn-edit" onclick="editProductType('${type.id}')" draggable="false">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteProductType('${type.id}')" draggable="false">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');

    // ドラッグ&ドロップイベントを追加
    setupProductTypeDragAndDrop();
}

// 商品タイプのドラッグ&ドロップ設定
function setupProductTypeDragAndDrop() {
    const items = document.querySelectorAll('#productTypesList .product-type-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            saveProductTypeOrder();
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElementForProductType(document.getElementById('productTypesList'), e.clientY);
            if (afterElement == null) {
                document.getElementById('productTypesList').appendChild(draggedItem);
            } else {
                document.getElementById('productTypesList').insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElementForProductType(container, y) {
    const draggableElements = [...container.querySelectorAll('.product-type-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveProductTypeOrder() {
    const items = document.querySelectorAll('#productTypesList .product-type-item');
    const updates = [];

    items.forEach((item, index) => {
        const id = item.dataset.id;
        updates.push(
            supabase
                .from('product_types')
                .update({ display_order: index })
                .eq('id', id)
        );
    });

    try {
        await Promise.all(updates);
        await loadProductTypes();
        console.log('✅ Product type order saved');
    } catch (error) {
        console.error('商品タイプ順序保存エラー:', error);
        showAlertModal('並び順の保存に失敗しました', 'error');
    }
}

window.openAddProductTypeModal = function() {
    editingProductTypeId = null;
    document.getElementById('productTypeModalTitle').textContent = '商品タイプを追加';
    document.getElementById('productTypeForm').reset();
    showModal('productTypeModal');
};

window.editProductType = function(id) {
    const type = productTypes.find(t => t.id === id);
    if (!type) return;

    editingProductTypeId = id;
    document.getElementById('productTypeModalTitle').textContent = '商品タイプを編集';
    document.getElementById('productTypeName').value = type.name;
    showModal('productTypeModal');
};

async function handleProductTypeSubmit(e) {
    e.preventDefault();
    console.log('handleProductTypeSubmit called');

    const name = document.getElementById('productTypeName').value.trim();

    console.log('Form data:', { name });

    if (!name) {
        showAlertModal('タイプ名は必須です', 'error');
        return;
    }

    try {
        if (editingProductTypeId) {
            // 更新
            console.log('Updating product type:', editingProductTypeId);
            const { error } = await supabase
                .from('product_types')
                .update({ name })
                .eq('id', editingProductTypeId);

            if (error) throw error;
            showAlertModal('商品タイプを更新しました', 'success');
        } else {
            // 新規追加
            console.log('Inserting new product type');
            const { error } = await supabase
                .from('product_types')
                .insert([{ name }]);

            if (error) throw error;
            showAlertModal('商品タイプを追加しました', 'success');
        }

        closeModal('productTypeModal');
        await loadProductTypes();
    } catch (error) {
        console.error('商品タイプ保存エラー:', error);
        showAlertModal('保存に失敗しました: ' + error.message, 'error');
    }
}

window.deleteProductType = async function(id) {
    showConfirmModal('この商品タイプを削除しますか？', async () => {
        try {
            // goemon-admin-db.jsの削除関数を呼び出し(削除保護ロジック付き)
            await window.deleteProductTypeFromDB(id);
            showAlertModal('商品タイプを削除しました', 'success');
            await loadProductTypes();
        } catch (error) {
            console.error('商品タイプ削除エラー:', error);
            showAlertModal('削除に失敗しました: ' + error.message, 'error');
        }
    });
};

window.closeProductTypeModal = function() {
    closeModal('productTypeModal');
};

// ===================================
// ヒーロー画像管理
// ===================================

async function loadHeroImages() {
    try {
        const { data, error } = await supabase
            .from('hero_images')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        heroImages = data || [];
        renderHeroImages();
    } catch (error) {
        console.error('ヒーロー画像読み込みエラー:', error);
    }
}

function renderHeroImages() {
    const list = document.getElementById('heroImagesList');
    if (!list) return;

    if (heroImages.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-image"></i><p>ヒーロー画像がありません</p></div>';
        return;
    }

    list.innerHTML = heroImages.map(img => `
        <div class="hero-image-item" data-id="${img.id}" draggable="true">
            <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
            <div class="hero-image-preview">
                ${img.image_url ? `<img src="${img.image_url}" alt="Hero">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
            </div>
            <div class="hero-image-info">
                <p>${img.image_url || 'URLなし'}</p>
            </div>
            <div class="hero-image-actions">
                <button class="btn-small btn-edit" onclick="editHeroImage('${img.id}')" draggable="false">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteHeroImage('${img.id}')" draggable="false">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');

    // ドラッグ&ドロップイベントを追加
    setupHeroImageDragAndDrop();
}

// ヒーロー画像のドラッグ&ドロップ設定
function setupHeroImageDragAndDrop() {
    const items = document.querySelectorAll('#heroImagesList .hero-image-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            saveHeroImageOrder();
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElementForHeroImage(document.getElementById('heroImagesList'), e.clientY);
            if (afterElement == null) {
                document.getElementById('heroImagesList').appendChild(draggedItem);
            } else {
                document.getElementById('heroImagesList').insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElementForHeroImage(container, y) {
    const draggableElements = [...container.querySelectorAll('.hero-image-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveHeroImageOrder() {
    const items = document.querySelectorAll('#heroImagesList .hero-image-item');
    const updates = [];

    items.forEach((item, index) => {
        const id = item.dataset.id;
        updates.push(
            supabase
                .from('hero_images')
                .update({ display_order: index })
                .eq('id', id)
        );
    });

    try {
        await Promise.all(updates);
        await loadHeroImages();
        console.log('✅ Hero image order saved');
    } catch (error) {
        console.error('ヒーロー画像順序保存エラー:', error);
        showAlertModal('並び順の保存に失敗しました', 'error');
    }
}

// ===================================
// ヒーロー画像ファイル選択処理
// ===================================

async function handleHeroImageFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, 'bytes');

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlertModal('ファイルサイズは5MB以下にしてください', 'error');
        e.target.value = '';
        return;
    }

    try {
        // Supabase Storageにアップロード
        const fileExt = file.name.split('.').pop();
        const fileName = `hero-${Date.now()}.${fileExt}`;
        const filePath = `hero-images/${fileName}`;

        console.log('Uploading to:', filePath);

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // 公開URLを取得
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        console.log('Upload success, URL:', publicUrl);

        // URLをフィールドに設定
        document.getElementById('heroImageUrl').value = publicUrl;

        // プレビュー表示
        const preview = document.getElementById('heroImagePreview');
        preview.innerHTML = `<img src="${publicUrl}" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;">`;
        preview.style.display = 'block';

        showAlertModal('画像をアップロードしました', 'success');
    } catch (error) {
        console.error('画像アップロードエラー:', error);
        showAlertModal('画像のアップロードに失敗しました: ' + error.message, 'error');
        e.target.value = '';
    }
}

window.openAddHeroImageModal = function() {
    editingHeroImageId = null;
    document.getElementById('heroImageModalTitle').textContent = 'ヒーロー画像を追加';
    document.getElementById('heroImageForm').reset();
    document.getElementById('heroImageFile').value = '';
    document.getElementById('heroImagePreview').style.display = 'none';
    showModal('heroImageModal');
};

window.editHeroImage = function(id) {
    const image = heroImages.find(img => img.id === id);
    if (!image) return;

    editingHeroImageId = id;
    document.getElementById('heroImageModalTitle').textContent = 'ヒーロー画像を編集';
    document.getElementById('heroImageUrl').value = image.image_url || '';
    document.getElementById('heroImageLink').value = image.link_url || '';
    showModal('heroImageModal');
};

async function handleHeroImageSubmit(e) {
    e.preventDefault();
    console.log('handleHeroImageSubmit called');

    const image_url = document.getElementById('heroImageUrl').value.trim();
    const link_url = document.getElementById('heroImageLink').value.trim();

    console.log('Form data:', { image_url, link_url });

    if (!image_url) {
        showAlertModal('画像URLは必須です', 'error');
        return;
    }

    try {
        if (editingHeroImageId) {
            // 更新
            console.log('Updating hero image:', editingHeroImageId);
            const { error } = await supabase
                .from('hero_images')
                .update({ image_url, link_url, is_active: true })
                .eq('id', editingHeroImageId);

            if (error) throw error;
            showAlertModal('ヒーロー画像を更新しました', 'success');
        } else {
            // 新規追加
            console.log('Inserting new hero image');
            const { error } = await supabase
                .from('hero_images')
                .insert([{
                    image_url,
                    link_url,
                    is_active: true,
                    display_order: heroImages.length
                }]);

            if (error) throw error;
            showAlertModal('ヒーロー画像を追加しました', 'success');
        }

        closeModal('heroImageModal');
        await loadHeroImages();
    } catch (error) {
        console.error('ヒーロー画像保存エラー:', error);
        showAlertModal('保存に失敗しました: ' + error.message, 'error');
    }
}

window.deleteHeroImage = async function(id) {
    showConfirmModal('このヒーロー画像を削除しますか？', async () => {
        try {
            const { error } = await supabase
                .from('hero_images')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showAlertModal('ヒーロー画像を削除しました', 'success');
            await loadHeroImages();
        } catch (error) {
            console.error('ヒーロー画像削除エラー:', error);
            showAlertModal('削除に失敗しました: ' + error.message, 'error');
        }
    });
};

window.closeHeroImageModal = function() {
    closeModal('heroImageModal');
};

// ===================================
// モーダル管理
// ===================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    setTimeout(() => {
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const container = modal.querySelector('.modal-cmn-container');
    if (container) {
        container.classList.remove('active');
    }

    setTimeout(() => {
        modal.style.display = 'none';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }, 300);
}
