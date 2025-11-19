// 五右衛門 ECサイト - 注文確認ページ JavaScript
(function() {
    'use strict';

    let orderData = null;
    let productsData = {};
    let currentUser = null;

    // 商品データを初期化
    function initializeProductsData() {
        if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
            productsData = window.GOEMON_PRODUCTS.generateProductsData(100);
        } else {
            console.error('GOEMON_PRODUCTS not loaded');
        }
    }

    document.addEventListener('DOMContentLoaded', async function() {
        // 商品データを初期化
        initializeProductsData();

        // セッションストレージから注文データを取得
        const checkoutData = sessionStorage.getItem('checkoutData');
        if (!checkoutData) {
            alert('注文データが見つかりません');
            window.location.href = 'goemon-cart.html';
            return;
        }

        try {
            orderData = JSON.parse(checkoutData);
        } catch (error) {
            console.error('Error parsing checkout data:', error);
            alert('注文データの読み込みに失敗しました');
            window.location.href = 'goemon-cart.html';
            return;
        }

        // ログイン状態を確認
        await checkLoginStatus();

        // 注文内容を表示
        renderOrderConfirmation();

        // 注文確定ボタンのイベント
        document.getElementById('btnPlaceOrder').addEventListener('click', handlePlaceOrder);
    });

    // ログイン状態を確認
    async function checkLoginStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentUser = user;
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    }

    // 注文内容を表示
    function renderOrderConfirmation() {
        // 配送先情報
        const shippingInfo = document.getElementById('shippingInfo');
        const addr = orderData.shippingAddress;
        shippingInfo.innerHTML = `
            <p><strong>${addr.name}</strong></p>
            <p>〒${addr.postalCode}</p>
            <p>${addr.prefecture}${addr.city}${addr.address1}</p>
            ${addr.address2 ? `<p>${addr.address2}</p>` : ''}
            <p>電話: ${addr.phone}</p>
        `;

        // お支払い方法
        const paymentInfo = document.getElementById('paymentInfo');
        const paymentMethods = {
            'credit': 'クレジットカード',
            'convenience': 'コンビニ決済',
            'bank': '銀行振込',
            'cod': '代金引換'
        };
        paymentInfo.innerHTML = `<p>${paymentMethods[orderData.paymentMethod]}</p>`;

        // 注文商品
        const orderItems = document.getElementById('orderItems');
        orderItems.innerHTML = orderData.items.map(item => {
            const product = productsData[item.id];
            const itemTotal = (product ? product.price : item.price) * item.quantity;

            return `
                <div class="order-item-row" style="display: flex; gap: 15px; padding: 15px; border: 1px solid #eee; border-radius: 5px; margin-bottom: 10px;">
                    <div class="item-image" style="width: 80px; height: 80px; background: #f5f5f5; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-tshirt fa-2x" style="color: #ddd;"></i>
                    </div>
                    <div class="item-details" style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0;">${product ? product.name : item.name}</h4>
                        <p style="color: #666; font-size: 14px; margin: 0;">数量: ${item.quantity}</p>
                        ${item.color ? `<p style="color: #666; font-size: 14px; margin: 0;">カラー: ${item.color}</p>` : ''}
                        ${item.size ? `<p style="color: #666; font-size: 14px; margin: 0;">サイズ: ${item.size}</p>` : ''}
                    </div>
                    <div class="item-price" style="text-align: right;">
                        <p style="font-weight: bold; font-size: 18px; margin: 0;">¥${itemTotal.toLocaleString()}</p>
                    </div>
                </div>
            `;
        }).join('');

        // 金額サマリー
        document.getElementById('subtotal').textContent = `¥${orderData.subtotal.toLocaleString()}`;
        document.getElementById('shipping').textContent = `¥${orderData.shipping.toLocaleString()}`;
        document.getElementById('total').textContent = `¥${orderData.total.toLocaleString()}`;
    }

    // 注文を確定
    async function handlePlaceOrder() {
        // ローディング表示
        const loadingModal = document.getElementById('loadingModal');
        loadingModal.style.display = 'flex';
        setTimeout(() => {
            loadingModal.querySelector('.modal-cmn-container').classList.add('active');
        }, 10);

        try {
            // 注文番号を生成
            const orderId = generateOrderId();

            // 注文データを作成
            const order = {
                orderId: orderId,
                orderDate: new Date().toISOString(),
                status: '準備中', // 準備中, 配送中, 配送完了, キャンセル
                customerId: currentUser ? currentUser.id : null,
                customerEmail: currentUser ? currentUser.email : null,
                customerName: orderData.shippingAddress.name || null,
                items: orderData.items.map(item => ({
                    productId: String(item.id),
                    quantity: item.quantity,
                    price: productsData[item.id] ? productsData[item.id].price : item.price,
                    name: productsData[item.id] ? productsData[item.id].name : item.name
                })),
                shippingAddress: orderData.shippingAddress,
                paymentMethod: orderData.paymentMethod,
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                totalAmount: orderData.total
            };

            // localStorageに保存
            saveOrderToLocalStorage(order);

            // Supabaseに保存（ログインしている場合）
            if (currentUser) {
                await saveOrderToSupabase(order);
            }

            // カートをクリア
            localStorage.removeItem('goemoncart');

            // セッションストレージをクリア
            sessionStorage.removeItem('checkoutData');

            // 完了ページへリダイレクト
            sessionStorage.setItem('completedOrder', JSON.stringify(order));
            window.location.href = 'goemon-order-complete.html';

        } catch (error) {
            console.error('Error placing order:', error);
            loadingModal.style.display = 'none';
            alert('注文処理中にエラーが発生しました。もう一度お試しください。');
        }
    }

    // 注文番号を生成
    function generateOrderId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        return `ORD-${year}${month}${day}-${random}`;
    }

    // localStorageに注文を保存
    function saveOrderToLocalStorage(order) {
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];
        orders.push(order);
        localStorage.setItem('goemonorders', JSON.stringify(orders));
        console.log('Order saved to localStorage:', order);
    }

    // Supabaseに注文を保存（未実装）
    async function saveOrderToSupabase(order) {
        try {
            // TODO: Supabaseのordersテーブルに保存
            console.log('Order would be saved to Supabase:', order);

            // const { data, error } = await supabase
            //     .from('orders')
            //     .insert([order]);
            //
            // if (error) throw error;

        } catch (error) {
            console.error('Error saving to Supabase:', error);
            // Supabaseへの保存に失敗してもlocalStorageには保存されているので続行
        }
    }

})();
