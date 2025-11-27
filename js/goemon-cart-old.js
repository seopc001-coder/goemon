// 五右衛門 ECサイト - カートページ JavaScript

// グローバル変数
let cartItems = JSON.parse(localStorage.getItem('goemoncart')) || [
    {
        id: 1,
        name: 'カジュアルコットンブラウス',
        price: 2990,
        quantity: 1,
        color: 'ホワイト',
        size: 'M',
        image: ''
    },
    {
        id: 2,
        name: 'ハイウエストデニムパンツ',
        price: 3990,
        quantity: 1,
        color: 'ブルー',
        size: 'L',
        image: ''
    }
];

document.addEventListener('DOMContentLoaded', function() {
    initializeCartPage();
});

function initializeCartPage() {
    initializeQuantityButtons();
    initializeRemoveButtons();
    initializeCouponInput();
    renderCartSummary();
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
            const itemId = cartItem.dataset.itemId;

            if (confirm('この商品をカートから削除しますか？')) {
                removeCartItem(itemId);
                cartItem.remove();
                renderCartSummary();
                checkEmptyCart();
            }
        });
    });
}

// クーポン適用
function initializeCouponInput() {
    const applyCouponBtn = document.querySelector('.btn-apply-coupon');

    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function() {
            const couponInput = document.querySelector('.coupon-input');
            const couponCode = couponInput.value.trim();

            if (!couponCode) {
                alert('クーポンコードを入力してください');
                return;
            }

            applyCoupon(couponCode);
        });
    }
}

// カートアイテムの数量更新
function updateItemQuantity(cartItem, newQuantity) {
    const itemId = cartItem.dataset.itemId;
    const item = cartItems.find(i => i.id == itemId);

    if (item) {
        item.quantity = newQuantity;
        const newTotal = item.price * newQuantity;

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
function removeCartItem(itemId) {
    cartItems = cartItems.filter(item => item.id != itemId);
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
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
        alert(`クーポン「${couponCode}」が適用されました！\n${formatPrice(discountAmount)}割引`);
    } else {
        alert('無効なクーポンコードです');
    }
}

// 空のカートチェック
function checkEmptyCart() {
    if (cartItems.length === 0) {
        document.querySelector('.cart-items-section').innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart fa-4x"></i>
                <p>カートに商品がありません</p>
                <a href="/" class="btn-cmn-02">ショッピングを続ける</a>
            </div>
        `;

        document.querySelector('.cart-summary').style.display = 'none';
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
