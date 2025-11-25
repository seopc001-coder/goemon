// 五右衛門 ECサイト - 商品詳細ページ JavaScript

// グローバル変数
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
async function loadProductData() {
    const productId = getProductIdFromURL();

    console.log('=== 商品詳細ページ: データ読み込み開始 ===');
    console.log('商品ID:', productId);

    try {
        // Supabaseから商品データを取得
        const product = await fetchProductById(productId);

        if (product) {
            console.log('✓ Supabaseから商品を読み込みました:', productId);
            console.log('商品名:', product.name);
            console.log('公開状態:', product.is_published !== false ? '公開' : '非公開');

            // 非公開商品の場合は表示しない
            if (product.is_published === false) {
                console.log('→ 非公開商品のため表示しません');
                showProductNotFound();
                return;
            }

            console.log('→ 商品を表示します');
            productData = product;
            updateProductDisplay();

            // 閲覧数をカウント（Supabaseに保存）
            await incrementViewCount(productId);
        } else {
            // 商品が見つからない場合
            console.log('→ 商品が見つからないため、エラーページを表示します');
            showProductNotFound();
        }
    } catch (error) {
        console.error('Error loading product from Supabase:', error);
        showProductNotFound();
    }

    console.log('=== 商品詳細ページ: データ読み込み完了 ===');
}

// 閲覧数をカウント
// TODO: view_countカラムがproductsテーブルに追加されたら有効化
async function incrementViewCount(productId) {
    try {
        // await incrementProductViewCount(productId);
        // console.log('View count incremented for product:', productId);
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
    console.log('🔄 updateProductDisplay called with product:', productData);

    // ページを表示（フェードイン）
    const mainPage = document.querySelector('.product-detail-page');
    if (mainPage) {
        mainPage.style.opacity = '1';
    }

    // 商品タイトル
    const titleElement = document.querySelector('.product-title');
    console.log('📝 Updating title element:', titleElement, 'with name:', productData.name);
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

    // 商品説明を更新
    const descriptionElement = document.querySelector('.product-description p');
    if (descriptionElement && productData.description) {
        descriptionElement.textContent = productData.description;
    }

    // バリエーション選択UIを生成
    setupProductVariants();

    // 全体の売り切れ判定と表示
    checkAndDisplaySoldOutStatus();

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
    if (!addToCartBtn) {
        console.error('カートに追加ボタンが見つかりません');
        return;
    }

    console.log('カートに追加ボタンのイベントリスナーを登録しました');

    addToCartBtn.addEventListener('click', async function() {
        console.log('=== カートに追加ボタンがクリックされました ===');
        console.log('現在の選択: color =', selectedColor, ', size =', selectedSize, ', quantity =', quantity);
        console.log('現在のproductData:', productData);
        console.log('現在のproductData.id:', productData?.id);

        try {
            // 商品が削除されていないか再確認(Supabaseから取得)
            let currentProduct = null;

            try {
                currentProduct = await fetchProductById(productData.id);
            } catch (error) {
                console.error('Error checking product status:', error);
            }

            // 商品が存在しないか、非公開の場合はエラー
            if (!currentProduct || currentProduct.is_published === false) {
                alert('この商品は現在ご購入いただけません。商品が削除されたか、公開が停止されています。');
                // ページをリロードして最新の状態を表示
                window.location.reload();
                return;
            }

            const product = {
                id: productData.id,
                name: productData.name,
                price: productData.price,
                quantity: quantity,
                color: getColorName(selectedColor),
                size: selectedSize
            };

            console.log('カートに追加しようとしている商品:', product);
            console.log('addProductToCart関数を呼び出します...');
            await addProductToCart(product);
            console.log('addProductToCart関数が完了しました');
            console.log('モーダルを表示します');
            showModal();
            updateModalContent(product);
        } catch (error) {
            console.error('カート追加処理中にエラーが発生しました:', error);
            alert('カートへの追加に失敗しました。もう一度お試しください。');
        }
    });
}

// カラー名を取得
function getColorName(colorValue) {
    const colorMap = {
        'white': 'ホワイト',
        '白': '白',
        'black': 'ブラック',
        'pink': 'ピンク',
        'red': 'red',
        'レッド': 'レッド'
    };
    return colorMap[colorValue] || colorValue; // 見つからない場合はそのまま返す
}

// カートに追加
async function addProductToCart(product) {
    console.log('>>> addProductToCart関数が開始されました。product:', product);
    try {
        // Supabaseで認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();
        console.log('>>> セッション取得完了。ログイン状態:', session ? 'ログイン中' : 'ゲスト');

        if (session?.user) {
            // 認証ユーザー: Supabaseに追加
            const userId = session.user.id;
            console.log('>>> ユーザーID:', userId);

            // 既存のカートアイテムを取得
            console.log('>>> fetchCartItems関数を呼び出します...');
            const cartItems = await fetchCartItems(userId);
            console.log('>>> 取得したカートアイテム数:', cartItems ? cartItems.length : 'null/undefined');
            console.log('>>> カートアイテム:', cartItems);

            // 同じ商品・色・サイズのアイテムを探す
            const existingItem = cartItems.find(item => {
                const isSameProduct = item.product_id == product.id;
                const isSameColor = (item.color || '') === (product.color || '');
                const isSameSize = (item.size || '') === (product.size || '');
                return isSameProduct && isSameColor && isSameSize;
            });

            if (existingItem) {
                // 既存アイテムの数量を更新
                console.log('>>> 既存アイテムを発見。数量更新を開始します。');
                const newQuantity = existingItem.quantity + product.quantity;
                await updateCartItemQuantity(existingItem.id, newQuantity);
                console.log('カート数量を更新:', existingItem.id, newQuantity);
            } else {
                // 新しいアイテムを追加 (goemon-user-db.jsのaddCartItemToDb関数を呼び出す)
                console.log('>>> 新規アイテム追加を開始。addCartItemToDb関数の型:', typeof addCartItemToDb);
                console.log('>>> 追加するデータ:', {
                    productId: product.id,
                    quantity: product.quantity,
                    color: product.color,
                    size: product.size
                });

                try {
                    console.log('>>> addCartItemToDb関数を呼び出します...');
                    await addCartItemToDb(userId, {
                        productId: product.id,
                        quantity: product.quantity,
                        color: product.color,
                        size: product.size
                    });
                    console.log('>>> addCartItemToDb関数が完了しました');
                    console.log('カートに新規追加:', product);
                } catch (addError) {
                    console.error('>>> addCartItemToDb関数内でエラー発生:', addError);
                    throw addError;
                }
            }
        } else {
            // ゲストユーザー: localStorageに追加
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
        }

        updateCartCount();
    } catch (error) {
        console.error('カート追加エラー:', error);
        // エラー時はlocalStorageにフォールバック
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
async function loadRelatedProducts() {
    const container = document.getElementById('relatedProducts');
    if (!container) return;

    try {
        // Supabaseから同じカテゴリーの商品を取得
        const products = await fetchProductsByCategory(productData.category);

        // 現在の商品を除外
        const relatedProducts = products.filter(p => p.id !== productData.id);

        // ランダムに4件取得
        const shuffled = relatedProducts.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        selected.forEach(product => {
            const card = createProductCard(product);
            container.appendChild(card);
        });

        console.log('Related products loaded:', selected.length);
    } catch (error) {
        console.error('Error loading related products:', error);
    }
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


// カート数を更新
async function updateCartCount() {
    const countElements = document.querySelectorAll('.header-utility a[href*="cart"] .txt-noti');

    try {
        // 認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();

        let totalItems = 0;

        if (session?.user) {
            // ログインユーザー: Supabaseから取得
            const userId = session.user.id;
            const cartItems = await fetchCartItems(userId);
            totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        } else {
            // ゲストユーザー: localStorageから取得
            const localCart = JSON.parse(localStorage.getItem('goemoncart')) || [];
            totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
        }

        countElements.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    } catch (error) {
        console.error('カート数更新エラー:', error);
        // エラー時はlocalStorageから取得
        const localCart = JSON.parse(localStorage.getItem('goemoncart')) || [];
        const totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);

        countElements.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }
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

// ===================================
// 商品バリエーション機能
// ===================================

let selectedColor = null;
let selectedSize = null;

/**
 * 商品バリエーションのUIをセットアップ
 */
function setupProductVariants() {
    if (!productData || !productData.variants) {
        // バリエーションがない場合は非表示
        document.getElementById('colorSelectionContainer').style.display = 'none';
        document.getElementById('sizeSelectionContainer').style.display = 'none';
        return;
    }

    const variants = productData.variants;
    const colors = variants.colors || [];
    const sizes = variants.sizes || [];

    // 色の選択UIを生成
    if (colors.length > 0) {
        setupColorSelection(colors);
        selectedColor = colors[0]; // 最初の色を選択
    }

    // サイズの選択UIを生成
    if (sizes.length > 0) {
        setupSizeSelection(sizes);
        selectedSize = sizes[0]; // 最初のサイズを選択
    }

    // 在庫状況を更新
    updateStockStatus();
}

/**
 * 色選択UIを生成
 */
function setupColorSelection(colors) {
    const container = document.getElementById('colorSelectionContainer');
    const optionsContainer = document.getElementById('colorOptions');

    if (!container || !optionsContainer) return;

    container.style.display = 'block';
    optionsContainer.innerHTML = '';

    colors.forEach((color, index) => {
        const label = document.createElement('label');
        label.className = 'color-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'color';
        input.value = color;
        input.checked = index === 0;

        input.addEventListener('change', function() {
            if (this.checked) {
                selectedColor = color;
                updateStockStatus();
            }
        });

        const swatch = document.createElement('span');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = getColorCode(color);
        if (color === 'ホワイト' || color === '白' || color === 'white') {
            swatch.style.border = '1px solid #ddd';
        }

        const name = document.createElement('span');
        name.className = 'color-name';
        name.textContent = color;

        label.appendChild(input);
        label.appendChild(swatch);
        label.appendChild(name);
        optionsContainer.appendChild(label);
    });
}

/**
 * サイズ選択UIを生成
 */
function setupSizeSelection(sizes) {
    const container = document.getElementById('sizeSelectionContainer');
    const optionsContainer = document.getElementById('sizeOptions');

    if (!container || !optionsContainer) return;

    container.style.display = 'block';
    optionsContainer.innerHTML = '';

    sizes.forEach((size, index) => {
        const label = document.createElement('label');
        label.className = 'size-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'size';
        input.value = size;
        input.checked = index === 0;

        input.addEventListener('change', function() {
            if (this.checked) {
                selectedSize = size;
                updateStockStatus();
            }
        });

        const sizeLabel = document.createElement('span');
        sizeLabel.className = 'size-label';
        sizeLabel.textContent = size;

        label.appendChild(input);
        label.appendChild(sizeLabel);
        optionsContainer.appendChild(label);
    });
}

/**
 * 在庫状況を更新（バリエーションに応じて）
 */
function updateStockStatus() {
    if (!productData || !productData.variants) {
        // バリエーションがない場合は基本在庫を使用
        return;
    }

    const variants = productData.variants;
    const variantsStock = variants.stock || {};

    // 選択されたバリエーションの在庫キーを生成
    let stockKey = '';
    if (selectedColor && selectedSize) {
        stockKey = `${selectedColor}-${selectedSize}`;
    } else if (selectedColor) {
        stockKey = selectedColor;
    } else if (selectedSize) {
        stockKey = selectedSize;
    }

    // 在庫数を取得
    const stock = variantsStock[stockKey] || 0;

    // デバッグ用のログを追加
    console.log('=== 在庫チェック詳細 ===');
    console.log('選択された色:', selectedColor);
    console.log('選択されたサイズ:', selectedSize);
    console.log('生成されたキー:', stockKey);
    console.log('利用可能な在庫キー:', Object.keys(variantsStock));
    console.log('該当する在庫数:', stock);
    console.log('====================');

    // カートボタンの有効/無効を切り替え
    const addToCartBtn = document.querySelector('.btn-add-to-cart-large');
    if (addToCartBtn) {
        if (stock <= 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = '在庫切れ';
            addToCartBtn.style.background = '#ccc';
            addToCartBtn.style.cursor = 'not-allowed';
            console.log('ボタンを無効化しました（在庫なし）');
        } else {
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> カートに追加';
            addToCartBtn.style.background = '';
            addToCartBtn.style.cursor = 'pointer';
            console.log('ボタンを有効化しました（在庫あり:', stock, '個）');
            console.log('ボタンのdisabled状態:', addToCartBtn.disabled);
        }
    } else {
        console.error('カートに追加ボタンが見つかりません');
    }
}

/**
 * 商品全体の売り切れ状態をチェックして表示
 */
function checkAndDisplaySoldOutStatus() {
    let isAllSoldOut = false;

    // バリエーションがある場合
    if (productData && productData.variants && productData.variants.stock) {
        const variantsStock = productData.variants.stock;
        const allStockValues = Object.values(variantsStock);

        // すべての在庫が0の場合
        isAllSoldOut = allStockValues.every(stock => stock === 0);
    } else {
        // バリエーションがない場合は基本在庫をチェック
        isAllSoldOut = (productData.stock || 0) === 0;
    }

    // 在庫状況表示を常に非表示
    const stockStatusDisplay = document.getElementById('stockStatusDisplay');
    if (stockStatusDisplay) {
        stockStatusDisplay.style.display = 'none';
    }

    // 売り切れの場合、取り消し線を追加してカートボタンを無効化
    if (isAllSoldOut) {
        // 商品名、価格、カラー、サイズ、数量に取り消し線を追加
        const productName = document.querySelector('.product-name-detail');
        const productPrice = document.querySelector('.product-price-detail');
        const colorContainer = document.getElementById('colorSelectionContainer');
        const sizeContainer = document.getElementById('sizeSelectionContainer');
        const quantityContainer = document.querySelector('.product-option');

        if (productName) productName.style.textDecoration = 'line-through';
        if (productPrice) productPrice.style.textDecoration = 'line-through';
        if (colorContainer) colorContainer.style.textDecoration = 'line-through';
        if (sizeContainer) sizeContainer.style.textDecoration = 'line-through';
        if (quantityContainer) quantityContainer.style.textDecoration = 'line-through';

        const addToCartBtn = document.querySelector('.btn-add-to-cart-large');
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = '売り切れ';
            addToCartBtn.style.background = '#ccc';
            addToCartBtn.style.cursor = 'not-allowed';
        }
    } else {
        // 売り切れでない場合は取り消し線を解除
        const productName = document.querySelector('.product-name-detail');
        const productPrice = document.querySelector('.product-price-detail');
        const colorContainer = document.getElementById('colorSelectionContainer');
        const sizeContainer = document.getElementById('sizeSelectionContainer');
        const quantityContainer = document.querySelector('.product-option');

        if (productName) productName.style.textDecoration = 'none';
        if (productPrice) productPrice.style.textDecoration = 'none';
        if (colorContainer) colorContainer.style.textDecoration = 'none';
        if (sizeContainer) sizeContainer.style.textDecoration = 'none';
        if (quantityContainer) quantityContainer.style.textDecoration = 'none';
    }
}

/**
 * 色名から色コードを取得（簡易マッピング）
 */
function getColorCode(colorName) {
    const colorMap = {
        'レッド': '#ff0000',
        '赤': '#ff0000',
        'red': '#ff0000',
        'ブルー': '#0000ff',
        '青': '#0000ff',
        'blue': '#0000ff',
        'グリーン': '#00ff00',
        '緑': '#00ff00',
        'green': '#00ff00',
        'ブラック': '#000000',
        '黒': '#000000',
        'black': '#000000',
        'ホワイト': '#ffffff',
        '白': '#ffffff',
        'white': '#ffffff',
        'イエロー': '#ffff00',
        '黄色': '#ffff00',
        'yellow': '#ffff00',
        'ピンク': '#ffc0cb',
        'pink': '#ffc0cb',
        'オレンジ': '#ffa500',
        'orange': '#ffa500',
        'パープル': '#800080',
        '紫': '#800080',
        'purple': '#800080',
        'グレー': '#808080',
        '灰色': '#808080',
        'gray': '#808080',
        'ブラウン': '#a52a2a',
        '茶色': '#a52a2a',
        'brown': '#a52a2a',
        'ベージュ': '#f5f5dc',
        'beige': '#f5f5dc',
        'ネイビー': '#000080',
        'navy': '#000080'
    };

    return colorMap[colorName] || '#cccccc'; // デフォルトはグレー
}
