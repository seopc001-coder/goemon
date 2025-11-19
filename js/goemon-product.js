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

    if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.getProductById === 'function') {
        const product = window.GOEMON_PRODUCTS.getProductById(productId);
        if (product) {
            productData = product;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeProductPage();
});

function initializeProductPage() {
    // 商品データを読み込み
    loadProductData();

    initializeThumbnails();
    initializeColorSelection();
    initializeSizeSelection();
    initializeQuantity();
    initializeWishlistButton();
    initializeAddToCart();
    initializeTabs();
    loadRelatedProducts();
    initializeShareButtons();
}

// サムネイル画像クリック
function initializeThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            // すべてのサムネイルからactiveクラスを削除
            thumbnails.forEach(t => t.classList.remove('active'));
            // クリックされたサムネイルにactiveクラスを追加
            this.classList.add('active');

            // メイン画像を更新（実際の実装では画像URLを変更）
            console.log('メイン画像を変更:', index);
        });
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

    if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.getProductById === 'function') {
        relatedProductIds.forEach(id => {
            const product = window.GOEMON_PRODUCTS.getProductById(id);
            if (product) {
                const card = createProductCard(product);
                container.appendChild(card);
            }
        });
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
    const productName = encodeURIComponent(productData.name);
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
