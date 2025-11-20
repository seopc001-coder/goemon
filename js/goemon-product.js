// 五右衛門 ECサイト - 商品詳細ページ JavaScript

// グローバル変数
let selectedColor = 'white';
let selectedSize = 'M';
let quantity = 1;
let productData = {
    id: '1',
    name: 'カジュアルコットンブラウス',
    price: 2990
};

// ページ読み込み時にURLパラメータから商品IDを取得
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || '1';
}

// 商品データを読み込み
function loadProductData() {
    const productId = getProductIdFromURL();

    console.log('=== 商品詳細ページ: データ読み込み開始 ===');
    console.log('商品ID:', productId);

    // localStorageから商品データを取得
    const savedProducts = localStorage.getItem('goemonproducts');
    let product = null;

    if (savedProducts) {
        try {
            const productsData = JSON.parse(savedProducts);
            console.log('localStorage商品データ形式:', Array.isArray(productsData) ? '配列' : 'オブジェクト');
            console.log('localStorage商品数:', Array.isArray(productsData) ? productsData.length : Object.keys(productsData).length);

            // 配列形式かオブジェクト形式か判定して商品を検索
            if (Array.isArray(productsData)) {
                product = productsData.find(p => p.id === productId);
            } else {
                product = productsData[productId];
            }

            if (product) {
                console.log('✓ localStorageから商品を読み込みました:', productId);
                console.log('商品名:', product.name);
                console.log('公開状態:', product.isPublished !== false ? '公開' : '非公開');
            } else {
                console.log('✗ localStorageに商品が見つかりません:', productId);
            }
        } catch (error) {
            console.error('Error parsing saved products:', error);
        }
    } else {
        console.log('✗ localStorageにgoemonproductsが存在しません');
    }

    if (product) {
        // 非公開商品の場合は表示しない
        if (product.isPublished === false) {
            console.log('→ 非公開商品のため表示しません');
            showProductNotFound();
            return;
        }

        console.log('→ 商品を表示します');
        productData = product;
        updateProductDisplay();

        // 閲覧数をカウント（localStorageに保存）
        incrementViewCount(productId, savedProducts);
    } else {
        // 商品が見つからない場合
        console.log('→ 商品が見つからないため、エラーページを表示します');
        showProductNotFound();
    }

    console.log('=== 商品詳細ページ: データ読み込み完了 ===');
}

// 閲覧数をカウント
function incrementViewCount(productId, savedProductsString) {
    if (!savedProductsString) return;

    try {
        const productsData = JSON.parse(savedProductsString);
        let updated = false;

        if (Array.isArray(productsData)) {
            // 配列形式の場合
            const product = productsData.find(p => p.id === productId);
            if (product) {
                product.viewCount = (product.viewCount || 0) + 1;
                updated = true;
            }
        } else {
            // オブジェクト形式の場合
            if (productsData[productId]) {
                productsData[productId].viewCount = (productsData[productId].viewCount || 0) + 1;
                updated = true;
            }
        }

        if (updated) {
            localStorage.setItem('goemonproducts', JSON.stringify(productsData));
            console.log('View count incremented for product:', productId);
        }
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

// 商品情報を画面に表示
// 商品が見つからない場合の表示
function showProductNotFound() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.opacity = '1';
        mainContent.innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 80px; color: #999; margin-bottom: 30px;"></i>
                <h1 style="font-size: 28px; margin-bottom: 20px;">商品が見つかりません</h1>
                <p style="font-size: 16px; color: #666; margin-bottom: 40px;">
                    この商品は削除されたか、現在公開されていません。
                </p>
                <a href="goemon-index.html" style="display: inline-block; padding: 15px 40px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                    トップページに戻る
                </a>
            </div>
        `;
    }
}

function updateProductDisplay() {
    // ページを表示（フェードイン）
    const mainPage = document.querySelector('.product-detail-page');
    if (mainPage) {
        mainPage.style.opacity = '1';
    }

    // 商品タイトル
    const titleElement = document.querySelector('.product-title');
    if (titleElement) {
        titleElement.textContent = productData.name;
    }

    // 商品価格
    const priceElement = document.querySelector('.price-detail-current');
    if (priceElement) {
        priceElement.textContent = `¥${productData.price.toLocaleString()}`;
    }

    // 元の価格と割引率を表示（存在する場合）
    const hasDiscount = productData.originalPrice && productData.originalPrice > productData.price;
    if (hasDiscount) {
        const discount = Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100);

        // 元の価格を追加
        const originalPriceHTML = `<span class="price-detail-original" style="text-decoration: line-through; color: #999; margin-left: 10px;">¥${productData.originalPrice.toLocaleString()}</span>`;
        const discountHTML = `<span class="price-detail-discount" style="background: #ff4444; color: white; padding: 4px 8px; border-radius: 3px; font-size: 14px; margin-left: 10px;">${discount}%OFF</span>`;

        if (priceElement && !document.querySelector('.price-detail-original')) {
            priceElement.insertAdjacentHTML('afterend', originalPriceHTML + discountHTML);
        }
    }

    // 商品画像を更新
    updateProductImages();

    // 商品タグを更新
    updateProductTags();

    // パンくずリストの商品名を更新
    const breadcrumbElement = document.querySelector('.breadcrumb li:last-child');
    if (breadcrumbElement) {
        breadcrumbElement.textContent = productData.name;
    }

    // ページタイトルを更新
    document.title = `${productData.name} | 五右衛門`;

    // メタディスクリプションを更新
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', `${productData.name} - 五右衛門`);
    }

    // 在庫状況を更新
    updateStockStatus();
}

// 在庫状況を更新
function updateStockStatus() {
    const stockStatusElement = document.querySelector('.stock-status');
    const addToCartBtn = document.getElementById('addToCartBtn');

    if (!stockStatusElement) return;

    const isSoldOut = productData.stock === 0;

    if (isSoldOut) {
        // 売り切れの場合
        stockStatusElement.className = 'stock-status out-of-stock';
        stockStatusElement.innerHTML = '<i class="fas fa-times-circle"></i> 売り切れ';

        // カートに追加ボタンを無効化
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.style.background = '#ccc';
            addToCartBtn.style.cursor = 'not-allowed';
            addToCartBtn.innerHTML = '<i class="fas fa-times-circle"></i> 売り切れ';
        }
    } else {
        // 在庫ありの場合
        stockStatusElement.className = 'stock-status in-stock';
        stockStatusElement.innerHTML = '<i class="fas fa-check-circle"></i> 在庫あり';

        // カートに追加ボタンを有効化
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.style.background = '';
            addToCartBtn.style.cursor = '';
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> カートに追加';
        }
    }
}

// 商品タグを更新（商品タイプに応じて）
function updateProductTags() {
    const tagsContainer = document.getElementById('productTags');
    if (!tagsContainer) return;

    // タグをクリア
    tagsContainer.innerHTML = '';

    // 商品タイプが設定されている場合
    if (productData.productType) {
        const savedProductTypes = localStorage.getItem('goemonproducttypes');
        if (savedProductTypes) {
            try {
                const productTypes = JSON.parse(savedProductTypes);
                const productType = productTypes.find(t => t.slug === productData.productType);

                if (productType && productType.tag) {
                    const tagColor = productType.tagColor || 'blue';
                    const tagElement = document.createElement('span');
                    tagElement.className = `tag-${tagColor}`;
                    tagElement.textContent = productType.tag;
                    tagsContainer.appendChild(tagElement);
                }
            } catch (error) {
                console.error('Error loading product types for tags:', error);
            }
        }
    }
}

// 商品画像を更新（メイン画像とサムネイル）
function updateProductImages() {
    const images = [
        productData.image,
        productData.image2,
        productData.image3,
        productData.image4
    ].filter(img => img); // 空の画像URLを除外

    // メイン画像を更新
    const mainImageContainer = document.getElementById('mainProductImage');
    if (mainImageContainer && images.length > 0) {
        mainImageContainer.innerHTML = `<img src="${images[0]}" alt="${productData.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    // サムネイル画像を更新
    const thumbnailContainer = document.querySelector('.thumbnail-images');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.imageUrl = imageUrl;
            thumbnail.innerHTML = `<img src="${imageUrl}" alt="${productData.name} - 画像${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">`;
            thumbnailContainer.appendChild(thumbnail);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeProductPage();
});

async function initializeProductPage() {
    // 商品データを読み込み
    loadProductData();

    initializeThumbnails();
    initializeColorSelection();
    initializeSizeSelection();
    initializeQuantity();
    await initializeWishlistButton();
    initializeAddToCart();
    initializeTabs();
    loadRelatedProducts();
    initializeShareButtons();
}

// サムネイル画像クリック
function initializeThumbnails() {
    // サムネイルクリックイベントを動的に設定
    document.addEventListener('click', function(e) {
        const thumbnail = e.target.closest('.thumbnail');
        if (!thumbnail) return;

        const thumbnails = document.querySelectorAll('.thumbnail');
        const imageUrl = thumbnail.dataset.imageUrl;

        if (imageUrl) {
            // すべてのサムネイルからactiveクラスを削除
            thumbnails.forEach(t => t.classList.remove('active'));
            // クリックされたサムネイルにactiveクラスを追加
            thumbnail.classList.add('active');

            // メイン画像を更新
            const mainImageContainer = document.getElementById('mainProductImage');
            if (mainImageContainer) {
                mainImageContainer.innerHTML = `<img src="${imageUrl}" alt="${productData.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        }
    });
}

// カラー選択
function initializeColorSelection() {
    const colorInputs = document.querySelectorAll('input[name="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', function() {
            selectedColor = this.value;
            console.log('選択されたカラー:', selectedColor);
        });
    });
}

// サイズ選択
function initializeSizeSelection() {
    const sizeInputs = document.querySelectorAll('input[name="size"]');
    sizeInputs.forEach(input => {
        input.addEventListener('change', function() {
            selectedSize = this.value;
            console.log('選択されたサイズ:', selectedSize);
        });
    });
}

// 数量選択
function initializeQuantity() {
    const qtyInput = document.getElementById('quantity');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');

    if (qtyMinus) {
        qtyMinus.addEventListener('click', function() {
            let currentQty = parseInt(qtyInput.value);
            if (currentQty > 1) {
                qtyInput.value = currentQty - 1;
                quantity = currentQty - 1;
            }
        });
    }

    if (qtyPlus) {
        qtyPlus.addEventListener('click', function() {
            let currentQty = parseInt(qtyInput.value);
            const max = parseInt(qtyInput.max) || 10;
            if (currentQty < max) {
                qtyInput.value = currentQty + 1;
                quantity = currentQty + 1;
            }
        });
    }

    if (qtyInput) {
        qtyInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            const min = parseInt(this.min) || 1;
            const max = parseInt(this.max) || 10;

            if (value < min) value = min;
            if (value > max) value = max;

            this.value = value;
            quantity = value;
        });
    }
}

// お気に入りボタン
async function initializeWishlistButton() {
    const wishlistBtn = document.getElementById('productWishlistBtn');
    if (!wishlistBtn) return;

    // Supabaseからお気に入り状態を取得
    await loadWishlistState(wishlistBtn);

    wishlistBtn.addEventListener('click', async function() {
        await toggleWishlist(this);
    });
}

// お気に入り状態を読み込み
async function loadWishlistState(wishlistBtn) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        let wishlist = [];

        if (user) {
            // ログイン中：Supabaseから取得
            const { data, error } = await supabase
                .from('user_favorites')
                .select('product_id')
                .eq('user_id', user.id);

            if (!error && data) {
                wishlist = data.map(item => item.product_id);
            }
        } else {
            // 未ログイン：localStorageから取得
            wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
        }

        // ボタンの状態を更新
        if (wishlist.includes(productData.id)) {
            wishlistBtn.classList.add('active');
            const icon = wishlistBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }

        updateWishlistCount();
    } catch (error) {
        console.error('Error loading wishlist state:', error);
    }
}

// お気に入りの追加/削除を切り替え
async function toggleWishlist(button) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const icon = button.querySelector('i');
        const isCurrentlyFavorite = button.classList.contains('active');

        if (user) {
            // ログイン中：Supabaseで管理
            if (isCurrentlyFavorite) {
                // お気に入りから削除
                const { error } = await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productData.id);

                if (error) {
                    console.error('Error removing from favorites:', error);
                    return;
                }

                button.classList.remove('active');
                if (icon) {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            } else {
                // お気に入りに追加
                const { error } = await supabase
                    .from('user_favorites')
                    .insert([
                        { user_id: user.id, product_id: productData.id }
                    ]);

                if (error) {
                    console.error('Error adding to favorites:', error);
                    return;
                }

                button.classList.add('active');
                if (icon) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                }
            }

            // localStorageも同期
            const { data, error } = await supabase
                .from('user_favorites')
                .select('product_id')
                .eq('user_id', user.id);

            if (!error && data) {
                const wishlist = data.map(item => item.product_id);
                localStorage.setItem('goemonwishlist', JSON.stringify(wishlist));
            }
        } else {
            // 未ログイン：localStorageのみ
            let wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];

            if (isCurrentlyFavorite) {
                wishlist = wishlist.filter(id => id !== productData.id);
                button.classList.remove('active');
                if (icon) {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            } else {
                wishlist.push(productData.id);
                button.classList.add('active');
                if (icon) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                }
            }

            localStorage.setItem('goemonwishlist', JSON.stringify(wishlist));
        }

        updateWishlistCount();
    } catch (error) {
        console.error('Error toggling wishlist:', error);
    }
}

// カートに追加
function initializeAddToCart() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (!addToCartBtn) return;

    addToCartBtn.addEventListener('click', function() {
        const product = {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            quantity: quantity,
            color: getColorName(selectedColor),
            size: selectedSize
        };

        addToCart(product);
        showModal();
        updateModalContent(product);
    });
}

// カラー名を取得
function getColorName(colorValue) {
    const colorMap = {
        'white': 'ホワイト',
        'black': 'ブラック',
        'pink': 'ピンク'
    };
    return colorMap[colorValue] || 'ホワイト';
}

// カートに追加
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('goemoncart')) || [];

    const existingItem = cart.find(item =>
        item.id === product.id &&
        item.color === product.color &&
        item.size === product.size
    );

    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }

    localStorage.setItem('goemoncart', JSON.stringify(cart));
    updateCartCount();
}

// モーダル表示
function showModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addToCartModal');

    if (modalOverlay) modalOverlay.classList.add('active');
    if (modal) modal.classList.add('active');
}

// モーダルを閉じる
function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addToCartModal');

    if (modalOverlay) modalOverlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
}

// モーダル内容を更新
function updateModalContent(product) {
    const modal = document.getElementById('addToCartModal');
    if (!modal) return;

    const nameElement = modal.querySelector('.modal-product-name');
    const priceElement = modal.querySelector('.modal-product-price');
    const optionsElement = modal.querySelector('.modal-product-options');

    if (nameElement) nameElement.textContent = product.name;
    if (priceElement) priceElement.textContent = formatPrice(product.price);
    if (optionsElement) {
        optionsElement.textContent = `カラー: ${product.color} / サイズ: ${product.size} / 数量: ${product.quantity}`;
    }
}

// タブ切り替え
function initializeTabs() {
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabContents = document.querySelectorAll('.tab-content');

    tabHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const tabId = this.dataset.tab;

            // すべてのタブからactiveクラスを削除
            tabHeaders.forEach(h => h.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // クリックされたタブとコンテンツにactiveクラスを追加
            this.classList.add('active');
            const targetContent = document.getElementById(`tab-${tabId}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // モーダルクローズボタン
    const modalCloseBtn = document.querySelector('.modal-close');
    const continueShoppingBtn = document.querySelector('.modal-continue-shopping');
    const modalOverlay = document.getElementById('modalOverlay');

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
}

// 関連商品を読み込み
function loadRelatedProducts() {
    const container = document.getElementById('relatedProducts');
    if (!container) return;

    // 共通データから関連商品を取得
    const relatedProductIds = ['2', '3', '4', '5'];

    // localStorageから商品データを取得
    const savedProducts = localStorage.getItem('goemonproducts');
    let productsData = null;

    if (savedProducts) {
        try {
            productsData = JSON.parse(savedProducts);
        } catch (error) {
            console.error('Error parsing saved products:', error);
        }
    }

    relatedProductIds.forEach(id => {
        let product = null;

        // localStorageから商品を検索
        if (productsData) {
            if (Array.isArray(productsData)) {
                product = productsData.find(p => p.id === id);
            } else {
                product = productsData[id];
            }
        }

        // デモデータは使用しない

        if (product) {
            const card = createProductCard(product);
            container.appendChild(card);
        }
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

    // 在庫チェック
    const isSoldOut = product.stock === 0;

    card.innerHTML = `
        <div class="product-image">
            <div class="product-img-wrapper">
                <div class="product-placeholder">
                    <i class="fas fa-tshirt fa-3x"></i>
                </div>
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


// カート数を更新
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('goemoncart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const countElements = document.querySelectorAll('.header-utility a[href*="cart"] .txt-noti');
    countElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}

// SNSシェアボタンの初期化
function initializeShareButtons() {
    const currentUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`${productData.name} - 五右衛門`);

    // Instagram（Instagramは直接シェアできないため、コピー機能を実装）
    const instagramBtn = document.querySelector('.share-instagram');
    if (instagramBtn) {
        instagramBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // クリップボードにURLをコピー
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('URLをコピーしました！Instagramアプリで投稿してください。');
            }).catch(() => {
                alert('URLのコピーに失敗しました。');
            });
        });
    }

    // X (Twitter)
    const twitterBtn = document.querySelector('.share-twitter');
    if (twitterBtn) {
        twitterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`;
            window.open(twitterUrl, '_blank', 'width=600,height=400');
        });
    }

    // LINE
    const lineBtn = document.querySelector('.share-line');
    if (lineBtn) {
        lineBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const lineUrl = `https://social-plugins.line.me/lineit/share?url=${currentUrl}`;
            window.open(lineUrl, '_blank', 'width=600,height=400');
        });
    }

    // TikTok（TikTokは直接シェアできないため、コピー機能を実装）
    const tiktokBtn = document.querySelector('.share-tiktok');
    if (tiktokBtn) {
        tiktokBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // クリップボードにURLをコピー
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('URLをコピーしました！TikTokアプリで投稿してください。');
            }).catch(() => {
                alert('URLのコピーに失敗しました。');
            });
        });
    }
}
