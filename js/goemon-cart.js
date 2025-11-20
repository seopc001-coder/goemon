// 五右衛門 ECサイト - カートページ JavaScript

// グローバル変数
let cartItems = [];
let productsData = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeCartPage();
});

function initializeCartPage() {
    // 商品データをlocalStorageから読み込み
    const savedProducts = localStorage.getItem('goemonproducts');
    if (savedProducts) {
        try {
            const parsed = JSON.parse(savedProducts);
            productsData = Array.isArray(parsed) ?
                parsed.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) : parsed;
        } catch (error) {
            console.error('Error parsing products:', error);
            productsData = {};
        }
    } else {
        productsData = {};
    }

    // カートデータを読み込み
    loadCartData();

    // カートを描画
    renderCartItems();

    // カートサマリーを描画
    renderCartSummary();

    // クーポン入力を初期化
    initializeCouponInput();
}

// カートデータを読み込み
function loadCartData() {
    cartItems = JSON.parse(localStorage.getItem('goemoncart')) || [];
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
function markItemAsDeleted(cartItem) {
    // すでに削除済みの場合は戻す
    if (cartItem.classList.contains('deleted')) {
        restoreDeletedItem(cartItem);
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

    // localStorageから削除
    const itemId = cartItem.dataset.itemId;
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;
    removeCartItem(itemId, color, size);

    // サマリーを更新
    renderCartSummary();
}

// 削除済み商品を元に戻す
function restoreDeletedItem(cartItem) {
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

    // localStorageに追加し直す
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
    saveCart();

    // サマリーを更新
    renderCartSummary();
}

// カートアイテムの数量更新
function updateItemQuantity(cartItem, newQuantity) {
    const itemId = cartItem.dataset.itemId;
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;

    const item = cartItems.find(i =>
        i.id == itemId &&
        (i.color || '') === color &&
        (i.size || '') === size
    );

    if (item) {
        item.quantity = newQuantity;

        const product = productsData[item.id] || {};
        const newTotal = (product.price || item.price) * newQuantity;

        // 価格表示を更新
        const priceElement = cartItem.querySelector('.item-total-price');
        if (priceElement) {
            priceElement.textContent = formatPrice(newTotal);
        }

        saveCart();
        renderCartSummary();
    }
}

// カートから商品を削除
function removeCartItem(itemId, color, size) {
    cartItems = cartItems.filter(item => {
        const matchId = item.id == itemId;
        const matchColor = (item.color || '') === color;
        const matchSize = (item.size || '') === size;
        return !(matchId && matchColor && matchSize);
    });
    saveCart();
}

// カートサマリー表示
function renderCartSummary() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const discount = getCurrentDiscount();
    const total = subtotal + shipping - discount;

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

// クーポン割引を取得
function getCurrentDiscount() {
    // クーポン情報をローカルストレージから取得
    const appliedCoupon = localStorage.getItem('goemonappliedcoupon');
    return appliedCoupon ? parseInt(appliedCoupon) : 0;
}

// クーポン適用
function initializeCouponInput() {
    const applyCouponBtn = document.querySelector('.btn-apply-coupon');

    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function() {
            const couponInput = document.querySelector('.coupon-input');
            const couponCode = couponInput.value.trim();

            if (!couponCode) {
                showAlertModal('クーポンコードを入力してください', 'warning');
                return;
            }

            applyCoupon(couponCode);
        });
    }
}

// クーポン適用
function applyCoupon(couponCode) {
    // デモ用クーポン
    const validCoupons = {
        'WELCOME500': 500,
        'SPRING1000': 1000,
        'VIP2000': 2000
    };

    if (validCoupons[couponCode]) {
        const discountAmount = validCoupons[couponCode];
        localStorage.setItem('goemonappliedcoupon', discountAmount);

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
        showAlertModal('クーポン「' + couponCode + '」が適用されました！\n' + formatPrice(discountAmount) + '割引', 'success');
    } else {
        showAlertModal('無効なクーポンコードです', 'error');
    }
}

// カートをローカルストレージに保存
function saveCart() {
    localStorage.setItem('goemoncart', JSON.stringify(cartItems));
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
