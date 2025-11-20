// 五右衛門 ECサイト - チェックアウトページ JavaScript
(function() {
    'use strict';

    let cartItems = [];
    let productsData = {};
    let currentUser = null;

    // 商品データを初期化
    function initializeProductsData() {
        // デモ商品データを完全削除（ユーザーの要望により）
        localStorage.removeItem('goemonproducts');
        console.log('Demo products data cleared from localStorage');

        // 空のオブジェクトを使用
        productsData = {};
        console.log('No products in localStorage');
    }

    document.addEventListener('DOMContentLoaded', async function() {
        // 商品データを初期化
        initializeProductsData();

        // ログイン状態を確認
        await checkLoginStatus();

        // カートデータを読み込み
        loadCartData();

        // 注文サマリーを表示
        renderOrderSummary();

        // 確認ボタンのイベント
        document.getElementById('btnConfirmOrder').addEventListener('click', handleConfirmOrder);
    });

    // ログイン状態を確認
    async function checkLoginStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentUser = user;
                // ユーザー情報から配送先を自動入力
                autofillShippingInfo(user);
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    }

    // ユーザー情報から配送先を自動入力
    function autofillShippingInfo(user) {
        const metadata = user.user_metadata;
        if (metadata) {
            if (metadata.lastName) document.getElementById('lastName').value = metadata.lastName;
            if (metadata.firstName) document.getElementById('firstName').value = metadata.firstName;
            if (metadata.postalCode) document.getElementById('postalCode').value = metadata.postalCode;
            if (metadata.prefecture) document.getElementById('prefecture').value = metadata.prefecture;
            if (metadata.city) document.getElementById('city').value = metadata.city;
            if (metadata.address1) document.getElementById('address1').value = metadata.address1;
            if (metadata.address2) document.getElementById('address2').value = metadata.address2;
            if (metadata.phone) document.getElementById('phone').value = metadata.phone;
        }
    }

    // カートデータを読み込み
    function loadCartData() {
        const savedCart = localStorage.getItem('goemoncart');
        if (savedCart) {
            try {
                cartItems = JSON.parse(savedCart);
            } catch (error) {
                console.error('Error parsing cart data:', error);
                cartItems = [];
            }
        }

        // カートが空の場合はカートページにリダイレクト
        if (cartItems.length === 0) {
            showAlertModal('カートが空です', 'warning');
            setTimeout(() => {
                window.location.href = 'goemon-cart.html';
            }, 1500);
        }
    }

    // 注文サマリーを表示
    function renderOrderSummary() {
        const orderSummary = document.getElementById('orderSummary');
        const subtotalElem = document.getElementById('subtotal');
        const shippingElem = document.getElementById('shipping');
        const totalElem = document.getElementById('total');

        let subtotal = 0;

        orderSummary.innerHTML = cartItems.map(item => {
            const product = productsData[item.id];
            const itemTotal = (product ? product.price : item.price) * item.quantity;
            subtotal += itemTotal;

            return `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <p style="font-weight: 500;">${product ? product.name : item.name}</p>
                        <p style="color: #666; font-size: 14px;">数量: ${item.quantity}</p>
                    </div>
                    <p style="font-weight: bold;">¥${itemTotal.toLocaleString()}</p>
                </div>
            `;
        }).join('');

        const shipping = 500; // 送料固定
        const total = subtotal + shipping;

        subtotalElem.textContent = `¥${subtotal.toLocaleString()}`;
        shippingElem.textContent = `¥${shipping.toLocaleString()}`;
        totalElem.textContent = `¥${total.toLocaleString()}`;
    }

    // 注文を確認
    function handleConfirmOrder() {
        // フォームのバリデーション
        const lastName = document.getElementById('lastName').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const postalCode = document.getElementById('postalCode').value.trim();
        const prefecture = document.getElementById('prefecture').value;
        const city = document.getElementById('city').value.trim();
        const address1 = document.getElementById('address1').value.trim();
        const address2 = document.getElementById('address2').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        // 必須項目のチェック
        if (!lastName || !firstName || !postalCode || !prefecture || !city || !address1 || !phone) {
            showAlertModal('必須項目をすべて入力してください', 'warning');
            return;
        }

        // 郵便番号のバリデーション
        if (!/^[0-9]{7}$/.test(postalCode)) {
            showAlertModal('郵便番号は7桁の数字で入力してください', 'warning');
            return;
        }

        // 電話番号のバリデーション
        if (!/^[0-9]{10,11}$/.test(phone)) {
            showAlertModal('電話番号は10桁または11桁の数字で入力してください', 'warning');
            return;
        }

        // 注文データを作成
        const orderData = {
            shippingAddress: {
                name: `${lastName} ${firstName}`,
                lastName,
                firstName,
                postalCode,
                prefecture,
                city,
                address1,
                address2,
                phone
            },
            paymentMethod,
            items: cartItems,
            subtotal: calculateSubtotal(),
            shipping: 500,
            total: calculateSubtotal() + 500
        };

        // セッションストレージに保存して確認ページへ
        sessionStorage.setItem('checkoutData', JSON.stringify(orderData));
        window.location.href = 'goemon-order-confirm.html';
    }

    // 小計を計算
    function calculateSubtotal() {
        return cartItems.reduce((sum, item) => {
            const product = productsData[item.id];
            return sum + ((product ? product.price : item.price) * item.quantity);
        }, 0);
    }

})();
