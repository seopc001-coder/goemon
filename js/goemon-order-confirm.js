// 五右衛門 ECサイト - 注文確認ページ JavaScript
(function() {
    'use strict';

    let orderData = null;
    let productsData = {};
    let currentUser = null;

    // 商品データを初期化（Supabaseから読み込み）
    async function initializeProductsData() {
        try {
            const products = await fetchPublishedProducts();
            productsData = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            console.log('Loaded products from Supabase:', Object.keys(productsData).length);
        } catch (error) {
            console.error('Error loading products from Supabase:', error);
            productsData = {};
        }
    }

    document.addEventListener('DOMContentLoaded', async function() {
        // 商品データを初期化
        await initializeProductsData();

        // セッションストレージから注文データを取得
        const checkoutData = sessionStorage.getItem('checkoutData');
        if (!checkoutData) {
            alert('注文データが見つかりません');
            window.location.href = '/cart';
            return;
        }

        try {
            orderData = JSON.parse(checkoutData);
        } catch (error) {
            console.error('Error parsing checkout data:', error);
            alert('注文データの読み込みに失敗しました');
            window.location.href = '/cart';
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

    // 在庫を減らす
    async function deductProductStock(productId, quantity, color, size) {
        try {
            console.log(`🔍 在庫減少処理: 商品ID=${productId}, 数量=${quantity}, 色=${color}, サイズ=${size}`);

            // Supabaseから商品を取得
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (fetchError) {
                console.error('商品取得エラー:', fetchError);
                throw fetchError;
            }

            if (!product) {
                throw new Error(`商品が見つかりません: ${productId}`);
            }

            // バリエーション商品の場合
            if (product.variants && product.variants.stock && color) {
                const variantStock = product.variants.stock;

                if (variantStock[color] === undefined) {
                    throw new Error(`カラー "${color}" の在庫が見つかりません`);
                }

                if (variantStock[color] < quantity) {
                    throw new Error(`在庫不足: カラー "${color}" の在庫が足りません (在庫: ${variantStock[color]}, 注文: ${quantity})`);
                }

                // 在庫を減らす
                variantStock[color] -= quantity;

                // Supabaseを更新
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ variants: product.variants })
                    .eq('id', productId);

                if (updateError) {
                    console.error('在庫更新エラー:', updateError);
                    throw updateError;
                }

                console.log(`✅ バリエーション在庫減少: ${productId} (${color}) -${quantity} → 残り ${variantStock[color]}`);

            } else {
                // 通常商品の場合
                if (product.stock < quantity) {
                    throw new Error(`在庫不足: 商品の在庫が足りません (在庫: ${product.stock}, 注文: ${quantity})`);
                }

                // 在庫を減らす
                const newStock = product.stock - quantity;

                // Supabaseを更新
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ stock: newStock })
                    .eq('id', productId);

                if (updateError) {
                    console.error('在庫更新エラー:', updateError);
                    throw updateError;
                }

                console.log(`✅ 在庫減少: ${productId} -${quantity} → 残り ${newStock}`);
            }

        } catch (error) {
            console.error('在庫減少エラー:', productId, error);
            throw error;
        }
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
                items: orderData.items.map(item => {
                    const itemId = item.id || item.productId;
                    return {
                        productId: String(itemId),
                        quantity: item.quantity,
                        price: productsData[itemId] ? productsData[itemId].price : item.price,
                        name: productsData[itemId] ? productsData[itemId].name : item.name,
                        color: item.color || null,
                        size: item.size || null
                    };
                }),
                shippingAddress: orderData.shippingAddress,
                paymentMethod: orderData.paymentMethod,
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                pointDiscount: orderData.pointDiscount || 0,
                totalAmount: orderData.total
            };

            // 在庫を減らす
            console.log('🔄 在庫減少処理を開始');
            for (const item of order.items) {
                await deductProductStock(item.productId, item.quantity, item.color, item.size);
            }
            console.log('✅ 在庫減少完了');

            // localStorageに保存
            saveOrderToLocalStorage(order);

            // Supabaseに保存（ログインしている場合）
            if (currentUser) {
                await saveOrderToSupabase(order);
                // Supabaseのカートもクリア
                await clearCart(currentUser.id);
            }

            // localStorageのカートをクリア
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

    // 注文番号を生成（Supabaseと同じ形式）
    function generateOrderId() {
        return 'GO' + Date.now();
    }

    // localStorageに注文を保存
    function saveOrderToLocalStorage(order) {
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];
        orders.push(order);
        localStorage.setItem('goemonorders', JSON.stringify(orders));
        console.log('Order saved to localStorage:', order);
    }

    // Supabaseに注文を保存
    async function saveOrderToSupabase(order) {
        try {
            // 注文データをSupabase用フォーマットに変換
            const orderData = {
                purchaserFamilyName: order.shippingAddress.name ? order.shippingAddress.name.split(' ')[0] : '',
                purchaserGivenName: order.shippingAddress.name ? order.shippingAddress.name.split(' ')[1] || '' : '',
                purchaserFamilyNameKana: '',
                purchaserGivenNameKana: '',
                purchaserPhone: order.shippingAddress.phone || '',
                purchaserEmail: order.customerEmail || '',
                shippingFamilyName: order.shippingAddress.name ? order.shippingAddress.name.split(' ')[0] : '',
                shippingGivenName: order.shippingAddress.name ? order.shippingAddress.name.split(' ')[1] || '' : '',
                shippingFamilyNameKana: '',
                shippingGivenNameKana: '',
                shippingPhone: order.shippingAddress.phone || '',
                shippingPostalCode: order.shippingAddress.postalCode || '',
                shippingPrefecture: order.shippingAddress.prefecture || '',
                shippingCity: order.shippingAddress.city || '',
                shippingAddress1: order.shippingAddress.address1 || '',
                shippingAddress2: order.shippingAddress.address2 || '',
                paymentMethod: order.paymentMethod || 'credit',
                subtotal: order.subtotal || 0,
                shippingFee: order.shipping || 0,
                tax: 0, // 税金計算は別途実装が必要な場合
                discount: order.pointDiscount || 0,
                total: order.total || order.totalAmount || 0,
                couponCode: null,
                deliveryDate: null,
                deliveryTime: null,
                notes: null,
                items: order.items.map(item => ({
                    productId: String(item.productId || item.id),
                    productName: item.name || '',
                    productPrice: item.price || 0,
                    quantity: item.quantity || 1,
                    color: item.color || null,
                    size: item.size || null,
                    subtotal: (item.price || 0) * (item.quantity || 1)
                }))
            };

            // createOrder関数を使用してSupabaseに保存（生成済みの注文番号を渡す）
            const result = await createOrder(currentUser.id, orderData, order.orderId);
            console.log('Order saved to Supabase:', result);

            // ポイントは管理画面で「発送済み」に変更したタイミングで付与されます

            return result;

        } catch (error) {
            console.error('Error saving to Supabase:', error);
            // Supabaseへの保存に失敗してもlocalStorageには保存されているので続行
            throw error;
        }
    }

})();
