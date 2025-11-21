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
    if (confirm('ログアウトしますか？')) {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminId');
        window.location.href = 'goemon-admin-login.html';
    }
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
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        categories = data || [];
        renderCategories();
    } catch (error) {
        console.error('カテゴリ読み込みエラー:', error);
    }
}

function renderCategories() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    if (categories.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><p>カテゴリがありません</p></div>';
        return;
    }

    list.innerHTML = categories.map(cat => `
        <div class="category-item" data-id="${cat.id}">
            <div class="category-info">
                <h3>${cat.name}</h3>
                <p>スラッグ: ${cat.slug || ''}</p>
            </div>
            <div class="category-actions">
                <button class="btn-small btn-edit" onclick="editCategory('${cat.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteCategory('${cat.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');
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
    document.getElementById('categorySlug').value = category.slug || '';
    document.getElementById('categoryDescription').value = category.description || '';
    showModal('categoryModal');
};

async function handleCategorySubmit(e) {
    e.preventDefault();
    console.log('handleCategorySubmit called');

    const name = document.getElementById('categoryName').value.trim();
    const slug = document.getElementById('categorySlug').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    console.log('Form data:', { name, slug, description });

    if (!name || !slug) {
        alert('カテゴリ名とスラッグは必須です');
        return;
    }

    try {
        if (editingCategoryId) {
            // 更新
            console.log('Updating category:', editingCategoryId);
            const { error } = await supabase
                .from('categories')
                .update({ name, slug, description })
                .eq('id', editingCategoryId);

            if (error) throw error;
            alert('カテゴリを更新しました');
        } else {
            // 新規追加
            console.log('Inserting new category');
            const { error } = await supabase
                .from('categories')
                .insert([{ name, slug, description, display_order: categories.length }]);

            if (error) throw error;
            alert('カテゴリを追加しました');
        }

        closeModal('categoryModal');
        await loadCategories();
    } catch (error) {
        console.error('カテゴリ保存エラー:', error);
        alert('保存に失敗しました: ' + error.message);
    }
}

window.deleteCategory = async function(id) {
    if (!confirm('このカテゴリを削除しますか？')) return;

    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        alert('カテゴリを削除しました');
        await loadCategories();
    } catch (error) {
        console.error('カテゴリ削除エラー:', error);
        alert('削除に失敗しました: ' + error.message);
    }
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
        <div class="product-type-item" data-id="${type.id}">
            <div class="product-type-info">
                <h3>${type.name}</h3>
                <p>スラッグ: ${type.slug || ''}</p>
            </div>
            <div class="product-type-actions">
                <button class="btn-small btn-edit" onclick="editProductType('${type.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteProductType('${type.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');
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
    document.getElementById('productTypeSlug').value = type.slug || '';
    document.getElementById('productTypeDescription').value = type.description || '';
    document.getElementById('productTypeTag').value = type.tag_label || '';
    document.getElementById('productTypeTagColor').value = type.tag_color || 'blue';
    showModal('productTypeModal');
};

async function handleProductTypeSubmit(e) {
    e.preventDefault();
    console.log('handleProductTypeSubmit called');

    const name = document.getElementById('productTypeName').value.trim();
    const slug = document.getElementById('productTypeSlug').value.trim();
    const description = document.getElementById('productTypeDescription').value.trim();
    const tag_label = document.getElementById('productTypeTag').value.trim();
    const tag_color = document.getElementById('productTypeTagColor').value;

    console.log('Form data:', { name, slug, description, tag_label, tag_color });

    if (!name || !slug) {
        alert('タイプ名とスラッグは必須です');
        return;
    }

    try {
        if (editingProductTypeId) {
            // 更新
            console.log('Updating product type:', editingProductTypeId);
            const { error } = await supabase
                .from('product_types')
                .update({ name, slug, description, tag_label, tag_color })
                .eq('id', editingProductTypeId);

            if (error) throw error;
            alert('商品タイプを更新しました');
        } else {
            // 新規追加
            console.log('Inserting new product type');
            const { error } = await supabase
                .from('product_types')
                .insert([{
                    name,
                    slug,
                    description,
                    tag_label,
                    tag_color,
                    display_order: productTypes.length
                }]);

            if (error) throw error;
            alert('商品タイプを追加しました');
        }

        closeModal('productTypeModal');
        await loadProductTypes();
    } catch (error) {
        console.error('商品タイプ保存エラー:', error);
        alert('保存に失敗しました: ' + error.message);
    }
}

window.deleteProductType = async function(id) {
    if (!confirm('この商品タイプを削除しますか？')) return;

    try {
        const { error } = await supabase
            .from('product_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
        alert('商品タイプを削除しました');
        await loadProductTypes();
    } catch (error) {
        console.error('商品タイプ削除エラー:', error);
        alert('削除に失敗しました: ' + error.message);
    }
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
        <div class="hero-image-item" data-id="${img.id}">
            <div class="hero-image-preview">
                ${img.image_url ? `<img src="${img.image_url}" alt="Hero">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
            </div>
            <div class="hero-image-info">
                <p>${img.image_url || 'URLなし'}</p>
            </div>
            <div class="hero-image-actions">
                <button class="btn-small btn-edit" onclick="editHeroImage('${img.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
                <button class="btn-small btn-delete" onclick="deleteHeroImage('${img.id}')">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `).join('');
}

window.openAddHeroImageModal = function() {
    editingHeroImageId = null;
    document.getElementById('heroImageModalTitle').textContent = 'ヒーロー画像を追加';
    document.getElementById('heroImageForm').reset();
    showModal('heroImageModal');
};

window.editHeroImage = function(id) {
    const image = heroImages.find(img => img.id === id);
    if (!image) return;

    editingHeroImageId = id;
    document.getElementById('heroImageModalTitle').textContent = 'ヒーロー画像を編集';
    document.getElementById('heroImageUrl').value = image.image_url || '';
    document.getElementById('heroImageLink').value = image.link_url || '';
    document.getElementById('heroImageAlt').value = image.alt_text || '';
    document.getElementById('heroImageTitle').value = image.title || '';
    showModal('heroImageModal');
};

async function handleHeroImageSubmit(e) {
    e.preventDefault();
    console.log('handleHeroImageSubmit called');

    const image_url = document.getElementById('heroImageUrl').value.trim();
    const link_url = document.getElementById('heroImageLink').value.trim();
    const alt_text = document.getElementById('heroImageAlt').value.trim();
    const title = document.getElementById('heroImageTitle').value.trim();

    console.log('Form data:', { image_url, link_url, alt_text, title });

    if (!image_url || !alt_text) {
        alert('画像URLと代替テキストは必須です');
        return;
    }

    try {
        if (editingHeroImageId) {
            // 更新
            console.log('Updating hero image:', editingHeroImageId);
            const { error } = await supabase
                .from('hero_images')
                .update({ image_url, link_url, alt_text, title, is_active: true })
                .eq('id', editingHeroImageId);

            if (error) throw error;
            alert('ヒーロー画像を更新しました');
        } else {
            // 新規追加
            console.log('Inserting new hero image');
            const { error } = await supabase
                .from('hero_images')
                .insert([{
                    image_url,
                    link_url,
                    alt_text,
                    title,
                    is_active: true,
                    display_order: heroImages.length
                }]);

            if (error) throw error;
            alert('ヒーロー画像を追加しました');
        }

        closeModal('heroImageModal');
        await loadHeroImages();
    } catch (error) {
        console.error('ヒーロー画像保存エラー:', error);
        alert('保存に失敗しました: ' + error.message);
    }
}

window.deleteHeroImage = async function(id) {
    if (!confirm('このヒーロー画像を削除しますか？')) return;

    try {
        const { error } = await supabase
            .from('hero_images')
            .delete()
            .eq('id', id);

        if (error) throw error;
        alert('ヒーロー画像を削除しました');
        await loadHeroImages();
    } catch (error) {
        console.error('ヒーロー画像削除エラー:', error);
        alert('削除に失敗しました: ' + error.message);
    }
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
