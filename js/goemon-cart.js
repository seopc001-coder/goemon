// 五右衛門 ECサイト - カートページ JavaScript

// グローバル変数
let cartItems = [];
let productsData = {};
let availableCoupons = [];
let selectedCoupon = null;
let pointAwardRate = 100; // デフォルト: 100円 = 1pt

document.addEventListener('DOMContentLoaded', function() {
    initializeCartPage();
});

async function initializeCartPage() {
    // 商品データをSupabaseから読み込み
    try {
        const products = await fetchPublishedProducts();
        productsData = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    } catch (error) {
        console.error('Error loading products from Supabase:', error);
        productsData = {};
    }

    // ポイント付与レートを読み込み
    await loadPointAwardRate();

    // 有効なクーポンを読み込み
    await loadAvailableCoupons();

    // カートデータを読み込み
    await loadCartData();

    // カートを描画
    renderCartItems();

    // カートサマリーを描画
    renderCartSummary();

    // クーポン選択を初期化
    initializeCouponSelect();
}

// カートデータを読み込み（認証ユーザーはSupabase、ゲストはlocalStorage）
async function loadCartData() {
    try {
        // Supabaseで認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // 認証ユーザー: Supabaseからカートを読み込み
            const userId = session.user.id;
            const dbCartItems = await fetchCartItems(userId);

            // DBのフォーマットをアプリ用に変換
            cartItems = dbCartItems.map(item => ({
                id: item.product_id,
                name: '', // 商品データから取得
                price: 0, // 商品データから取得
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                cartItemId: item.id // DB上のカートアイテムID
            }));

            console.log('Loaded cart from Supabase:', cartItems.length, 'items');
        } else {
            // ゲストユーザー: localStorageから読み込み
            cartItems = JSON.parse(localStorage.getItem('goemoncart')) || [];
            console.log('Loaded cart from localStorage:', cartItems.length, 'items');
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        // エラー時はlocalStorageから読み込み
        cartItems = JSON.parse(localStorage.getItem('goemoncart')) || [];
    }
}

// カートアイテムを描画
function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    // コンテナをクリア
    container.innerHTML = '';

    if (cartItems.length === 0) {
        // 空のカート表示
        container.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-shopping-cart fa-4x" style="color: #ddd; margin-bottom: 20px;"></i>
                <p style="font-size: 18px; color: #666; margin-bottom: 20px;">カートに商品がありません</p>
                <a href="goemon-index.html" class="btn-cmn-02">ショッピングを続ける</a>
            </div>
        `;
        const summaryElement = document.querySelector('.cart-summary');
        if (summaryElement) summaryElement.style.display = 'none';
        return;
    }

    // 各アイテムを描画
    cartItems.forEach(item => {
        const itemElement = createCartItemElement(item);
        container.appendChild(itemElement);
    });

    // イベントリスナーを初期化
    initializeQuantityButtons();
    initializeRemoveButtons();
}

// カートアイテム要素を生成
function createCartItemElement(item) {
    const product = productsData[item.id] || {};
    const itemTotal = (product.price || item.price) * item.quantity;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.dataset.itemId = item.id;
    itemDiv.dataset.color = item.color || '';
    itemDiv.dataset.size = item.size || '';

    const colorText = item.color ? '<p>カラー: ' + item.color + '</p>' : '';
    const sizeText = item.size ? '<p>サイズ: ' + item.size + '</p>' : '';
    const productName = product.name || item.name;
    const imageUrl = product.image || '';

    itemDiv.innerHTML = `
        <div class="cart-item-image">
            ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" style="width: 100%; height: 100%; object-fit: cover;">` : `
            <div class="product-placeholder">
                <i class="fas fa-tshirt fa-2x"></i>
            </div>
            `}
        </div>
        <div class="cart-item-details">
            <h3 class="cart-item-name">` + productName + `</h3>
            <div class="cart-item-options">
                ` + colorText + `
                ` + sizeText + `
            </div>
            <div class="cart-item-stock">在庫あり</div>
        </div>
        <div class="cart-item-quantity">
            <button class="qty-btn qty-minus" aria-label="数量を減らす">
                <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="qty-input" value="` + item.quantity + `" min="1" max="10">
            <button class="qty-btn qty-plus" aria-label="数量を増やす">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        <div class="cart-item-price">
            <span class="item-total-price">` + formatPrice(itemTotal) + `</span>
        </div>
        <div class="cart-item-remove">
            <button class="btn-remove-item" aria-label="削除">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    return itemDiv;
}

// 数量ボタン
function initializeQuantityButtons() {
    // プラスボタン
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            let value = parseInt(input.value);
            const max = parseInt(input.max) || 10;

            if (value < max) {
                input.value = value + 1;
                updateItemQuantity(this.closest('.cart-item'), value + 1);
            }
        });
    });

    // マイナスボタン
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.nextElementSibling;
            let value = parseInt(input.value);
            const min = parseInt(input.min) || 1;

            if (value > min) {
                input.value = value - 1;
                updateItemQuantity(this.closest('.cart-item'), value - 1);
            }
        });
    });

    // 直接入力
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            let value = parseInt(this.value);
            const min = parseInt(this.min) || 1;
            const max = parseInt(this.max) || 10;

            if (value < min) value = min;
            if (value > max) value = max;

            this.value = value;
            updateItemQuantity(this.closest('.cart-item'), value);
        });
    });
}

// 商品削除ボタン
function initializeRemoveButtons() {
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            markItemAsDeleted(cartItem);
        });
    });
}

// 商品を削除済みとしてマーク
async function markItemAsDeleted(cartItem) {
    // すでに削除済みの場合は戻す
    if (cartItem.classList.contains('deleted')) {
        await restoreDeletedItem(cartItem);
        return;
    }

    // 削除済みフラグを追加
    cartItem.classList.add('deleted');

    // 打ち消し線スタイルを追加
    cartItem.style.opacity = '0.6';
    cartItem.style.position = 'relative';
    cartItem.style.textDecoration = 'line-through';

    // ゴミ箱アイコンを戻すアイコンに変更
    const removeBtn = cartItem.querySelector('.btn-remove-item');
    if (removeBtn) {
        const icon = removeBtn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-undo';
        }
        removeBtn.setAttribute('aria-label', '元に戻す');
    }

    // カートアイテムを無効化（数量変更ボタンを無効に）
    const qtyButtons = cartItem.querySelectorAll('.qty-btn');
    const qtyInput = cartItem.querySelector('.qty-input');
    qtyButtons.forEach(btn => btn.disabled = true);
    if (qtyInput) qtyInput.disabled = true;

    // カートから削除
    const itemId = cartItem.dataset.itemId;
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;
    await removeCartItem(itemId, color, size);

    // サマリーを更新
    renderCartSummary();
}

// 削除済み商品を元に戻す
async function restoreDeletedItem(cartItem) {
    // 削除済みフラグを削除
    cartItem.classList.remove('deleted');

    // スタイルをリセット
    cartItem.style.opacity = '1';
    cartItem.style.textDecoration = 'none';

    // ゴミ箱アイコンを元に戻す
    const removeBtn = cartItem.querySelector('.btn-remove-item');
    if (removeBtn) {
        const icon = removeBtn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-trash-alt';
        }
        removeBtn.setAttribute('aria-label', '削除');
    }

    // 数量変更ボタンを有効に戻す
    const qtyButtons = cartItem.querySelectorAll('.qty-btn');
    const qtyInput = cartItem.querySelector('.qty-input');
    qtyButtons.forEach(btn => btn.disabled = false);
    if (qtyInput) qtyInput.disabled = false;

    // カートに追加し直す
    const itemId = cartItem.dataset.itemId;
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;
    const quantity = parseInt(qtyInput.value) || 1;

    const product = productsData[itemId] || {};
    const itemData = {
        id: itemId,
        name: product.name || cartItem.querySelector('.cart-item-name').textContent,
        price: product.price || 0,
        quantity: quantity,
        color: color || null,
        size: size || null
    };

    cartItems.push(itemData);
    await saveCart();

    // サマリーを更新
    renderCartSummary();
}

// カートアイテムの数量更新
async function updateItemQuantity(cartItem, newQuantity) {
    const itemId = cartItem.dataset.itemId;
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;

    console.log('>>> updateItemQuantity called:', { itemId, color, size, newQuantity });

    const item = cartItems.find(i => {
        const matchId = i.id == itemId;
        // 空文字列とundefinedを区別して比較
        const matchColor = (i.color === undefined || i.color === null ? '' : i.color) === (color === undefined || color === null ? '' : color);
        const matchSize = (i.size === undefined || i.size === null ? '' : i.size) === (size === undefined || size === null ? '' : size);

        console.log(`>>> Checking item for update:`, {
            id: i.id,
            color: i.color,
            size: i.size,
            matchId,
            matchColor,
            matchSize
        });

        return matchId && matchColor && matchSize;
    });

    if (item) {
        console.log('>>> Found item to update:', item);
        item.quantity = newQuantity;

        const product = productsData[item.id] || {};
        const newTotal = (product.price || item.price) * newQuantity;

        // 価格表示を更新
        const priceElement = cartItem.querySelector('.item-total-price');
        if (priceElement) {
            priceElement.textContent = formatPrice(newTotal);
        }

        await saveCart();
        renderCartSummary();
    } else {
        console.warn('>>> Item not found for update');
    }
}

// カートから商品を削除
async function removeCartItem(itemId, color, size) {
    console.log('>>> removeCartItem called:', { itemId, color, size });
    console.log('>>> Current cartItems:', cartItems);

    cartItems = cartItems.filter(item => {
        const matchId = item.id == itemId;
        // 空文字列とundefinedを区別して比較
        const matchColor = (item.color === undefined || item.color === null ? '' : item.color) === (color === undefined || color === null ? '' : color);
        const matchSize = (item.size === undefined || item.size === null ? '' : item.size) === (size === undefined || size === null ? '' : size);

        const shouldRemove = matchId && matchColor && matchSize;
        console.log(`>>> Checking item:`, {
            id: item.id,
            color: item.color,
            size: item.size,
            matchId,
            matchColor,
            matchSize,
            shouldRemove
        });

        return !shouldRemove;
    });

    console.log('>>> Filtered cartItems:', cartItems);
    await saveCart();
}

// カートサマリー表示
function renderCartSummary() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const discount = getCurrentDiscount();
    const total = subtotal + shipping - discount;
    const earnPoints = calculateEarnPoints(total);

    // 小計表示
    const subtotalElement = document.querySelector('.summary-subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(subtotal);
    }

    // アイテム数表示
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const titleElement = document.querySelector('.summary-row span:first-child');
    if (titleElement) {
        titleElement.textContent = `商品小計（${itemsCount}点）`;
    }

    // 配送料表示
    const shippingElement = document.querySelector('.summary-shipping');
    if (shippingElement) {
        shippingElement.textContent = shipping === 0 ? '無料' : formatPrice(shipping);
    }

    // 合計表示
    const totalElement = document.querySelector('.total-amount');
    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }

    // 獲得ポイント表示
    const earnPointsElement = document.querySelector('.earn-points');
    if (earnPointsElement) {
        earnPointsElement.textContent = earnPoints + ' pt';
    }
}

// ポイント付与レートを読み込み
async function loadPointAwardRate() {
    try {
        const rateSetting = await fetchSiteSetting('point_award_rate');
        pointAwardRate = rateSetting ? parseInt(rateSetting.value) : 100;
        console.log('Point award rate loaded:', pointAwardRate);
    } catch (error) {
        console.error('Error loading point award rate:', error);
        pointAwardRate = 100; // デフォルト値
    }
}

// 獲得ポイント計算（設定に基づく）
function calculateEarnPoints(total) {
    // pointAwardRate円につき1ポイント
    return Math.floor(total / pointAwardRate);
}

// レジに進む処理（認証チェック付き）
async function proceedToCheckout() {
    try {
        // Supabaseで認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // 未ログインの場合、ログインページに遷移（戻り先URLを指定）
            const returnUrl = encodeURIComponent('goemon-cart.html');
            window.location.href = `goemon-login.html?returnUrl=${returnUrl}`;
            return;
        }

        // ログイン済みの場合、チェックアウトページに遷移
        window.location.href = 'goemon-checkout.html';

    } catch (error) {
        console.error('Auth check error:', error);
        // エラー時もログインページに遷移
        const returnUrl = encodeURIComponent('goemon-cart.html');
        window.location.href = `goemon-login.html?returnUrl=${returnUrl}`;
    }
}

// 小計計算
function calculateSubtotal() {
    return cartItems.reduce((sum, item) => {
        const product = productsData[item.id] || {};
        const price = product.price || item.price;
        return sum + (price * item.quantity);
    }, 0);
}

// 配送料計算
function calculateShipping(subtotal) {
    return subtotal >= 5000 ? 0 : 500;
}

// 有効なクーポンを読み込み
async function loadAvailableCoupons() {
    try {
        availableCoupons = await fetchValidCoupons();
        console.log('Available coupons loaded:', availableCoupons.length);
    } catch (error) {
        console.error('Error loading coupons:', error);
        availableCoupons = [];
    }
}

// クーポン選択を初期化
function initializeCouponSelect() {
    const couponSelect = document.getElementById('couponSelect');
    if (!couponSelect) return;

    // クーポンオプションを追加
    availableCoupons.forEach(coupon => {
        const option = document.createElement('option');
        option.value = coupon.id;
        option.dataset.coupon = JSON.stringify(coupon);

        // クーポン表示テキスト作成
        let displayText = coupon.code + ' - ';
        if (coupon.type === 'percentage') {
            displayText += coupon.value + '%OFF';
        } else {
            displayText += formatPrice(coupon.value) + '引き';
        }

        if (coupon.description) {
            displayText += ' (' + coupon.description + ')';
        }

        option.textContent = displayText;
        couponSelect.appendChild(option);
    });

    // 選択イベントを設定
    couponSelect.addEventListener('change', function() {
        if (this.value) {
            const couponData = JSON.parse(this.selectedOptions[0].dataset.coupon);
            applyCoupon(couponData);
        } else {
            // クーポン選択解除
            selectedCoupon = null;
            hideCouponDiscount();
            renderCartSummary();
        }
    });
}

// クーポン割引を取得
function getCurrentDiscount() {
    if (!selectedCoupon) return 0;

    const subtotal = calculateSubtotal();
    let discount = 0;

    if (selectedCoupon.type === 'fixed') {
        // 固定額割引
        discount = selectedCoupon.value;
    } else if (selectedCoupon.type === 'percentage') {
        // パーセント割引
        discount = Math.floor(subtotal * (selectedCoupon.value / 100));

        // 最大割引額の制限
        if (selectedCoupon.max_discount && discount > selectedCoupon.max_discount) {
            discount = selectedCoupon.max_discount;
        }
    }

    // 小計を超える割引は適用しない
    return Math.min(discount, subtotal);
}

// クーポン適用
function applyCoupon(coupon) {
    const subtotal = calculateSubtotal();

    // 最小購入金額チェック
    if (coupon.min_purchase && subtotal < coupon.min_purchase) {
        showAlertModal(
            'このクーポンは' + formatPrice(coupon.min_purchase) + '以上のご購入で利用可能です',
            'warning'
        );
        // 選択をリセット
        const couponSelect = document.getElementById('couponSelect');
        if (couponSelect) couponSelect.value = '';
        return;
    }

    selectedCoupon = coupon;

    // 割引額を計算
    const discountAmount = getCurrentDiscount();

    // 割引行を表示
    const discountRow = document.querySelector('.summary-discount');
    if (discountRow) {
        discountRow.style.display = 'flex';
        const discountElement = discountRow.querySelector('.discount-amount');
        if (discountElement) {
            discountElement.textContent = '-' + formatPrice(discountAmount);
        }
    }

    renderCartSummary();

    let message = 'クーポン「' + coupon.code + '」が適用されました！\n';
    message += formatPrice(discountAmount) + '割引';
    showAlertModal(message, 'success');
}

// クーポン割引を非表示
function hideCouponDiscount() {
    const discountRow = document.querySelector('.summary-discount');
    if (discountRow) {
        discountRow.style.display = 'none';
    }
}

// カートを保存（認証ユーザーはSupabase、ゲストはlocalStorage）
async function saveCart() {
    try {
        // Supabaseで認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // 認証ユーザー: Supabaseに保存
            const userId = session.user.id;

            // 既存のカートをクリア
            await clearCart(userId);

            // 新しいカートアイテムを追加（DB関数を直接呼び出し、無限ループを防ぐ）
            for (const item of cartItems) {
                await window.addCartItemToDb(userId, {
                    productId: item.id,
                    quantity: item.quantity,
                    color: item.color,
                    size: item.size
                });
            }

            console.log('Cart saved to Supabase');
        } else {
            // ゲストユーザー: localStorageに保存
            localStorage.setItem('goemoncart', JSON.stringify(cartItems));
            console.log('Cart saved to localStorage');
        }
    } catch (error) {
        console.error('Error saving cart:', error);
        // エラー時はlocalStorageに保存
        localStorage.setItem('goemoncart', JSON.stringify(cartItems));
    }
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
