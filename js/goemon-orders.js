// 五右衛門 ECサイト - 注文履歴ページ JavaScript
(function() {
    'use strict';

    let ordersData = [];
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

        // ログイン状態を確認
        await checkLoginAndLoadOrders();

        // モーダルイベント
        initializeModal();
    });

    // ログイン状態確認と注文読み込み
    async function checkLoginAndLoadOrders() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // ログインしていない場合はlocalStorageから読み込み
                loadOrdersFromLocalStorage();
            } else {
                currentUser = user;
                // Supabaseから注文履歴を取得
                await loadOrdersFromSupabase(user.id);
            }

            renderOrders();
        } catch (error) {
            console.error('Error checking login status:', error);
            loadOrdersFromLocalStorage();
            renderOrders();
        }
    }

    // Supabaseから注文履歴を読み込み
    async function loadOrdersFromSupabase(userId) {
        try {
            const dbOrders = await fetchOrders(userId);

            // DB注文データをアプリ用フォーマットに変換
            ordersData = dbOrders.map(order => ({
                orderId: order.order_number,
                orderDate: order.created_at,
                status: mapOrderStatus(order.status),
                customerId: order.user_id,
                customerEmail: order.purchaser_email,
                customerName: `${order.shipping_family_name || ''} ${order.shipping_given_name || ''}`.trim(),
                items: order.order_items ? order.order_items.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    price: item.product_price,
                    name: item.product_name
                })) : [],
                shippingAddress: {
                    name: `${order.shipping_family_name || ''} ${order.shipping_given_name || ''}`.trim(),
                    lastName: order.shipping_family_name,
                    firstName: order.shipping_given_name,
                    postalCode: order.shipping_postal_code,
                    prefecture: order.shipping_prefecture,
                    city: order.shipping_city,
                    address1: order.shipping_address1,
                    address2: order.shipping_address2,
                    phone: order.shipping_phone
                },
                paymentMethod: order.payment_method,
                subtotal: order.subtotal,
                shipping: order.shipping_fee,
                totalAmount: order.total
            }));

            console.log('Loaded orders from Supabase:', ordersData.length);
        } catch (error) {
            console.error('Error loading orders from Supabase:', error);
            // エラー時はlocalStorageから読み込み
            loadOrdersFromLocalStorage();
        }
    }

    // 注文ステータスをマッピング
    function mapOrderStatus(status) {
        const statusMap = {
            'pending': '準備中',
            'processing': '準備中',
            'shipped': '発送完了',
            'delivered': '発送完了',
            'shipping': '発送完了',
            'completed': '発送完了',
            'cancelled': 'キャンセル'
        };
        return statusMap[status] || status;
    }

    // localStorageから注文履歴を読み込み
    function loadOrdersFromLocalStorage() {
        const savedOrders = localStorage.getItem('goemonorders');
        if (savedOrders) {
            try {
                ordersData = JSON.parse(savedOrders);
                console.log('Loaded orders from localStorage:', ordersData.length);
            } catch (error) {
                console.error('Error parsing orders:', error);
                ordersData = [];
            }
        } else {
            ordersData = [];
        }
    }

    // 注文履歴を表示
    function renderOrders() {
        const ordersList = document.getElementById('ordersList');
        const emptyOrders = document.getElementById('emptyOrders');

        if (!ordersData || ordersData.length === 0) {
            ordersList.style.display = 'none';
            emptyOrders.style.display = 'block';
            return;
        }

        ordersList.style.display = 'block';
        emptyOrders.style.display = 'none';

        // 日付順でソート（新しい順）
        const sortedOrders = [...ordersData].sort((a, b) => {
            return new Date(b.orderDate) - new Date(a.orderDate);
        });

        ordersList.innerHTML = sortedOrders.map(order => createOrderCard(order)).join('');

        // 詳細ボタンのイベント
        document.querySelectorAll('.btn-order-detail').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.dataset.orderId;
                showOrderDetail(orderId);
            });
        });
    }

    // 注文カードを生成
    function createOrderCard(order) {
        const orderDate = new Date(order.orderDate);
        const formattedDate = `${orderDate.getFullYear()}年${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;

        // ステータスのラベルと色
        const statusInfo = getStatusInfo(order.status);

        // 商品画像のHTMLを生成（最大3件）
        const itemsHTML = order.items.slice(0, 3).map(item => {
            // productIdを文字列と数値の両方で試す
            const productId = item.productId;
            let product = productsData[productId];

            // 文字列/数値の変換を試みる
            if (!product && typeof productId === 'string') {
                product = productsData[parseInt(productId)];
            } else if (!product && typeof productId === 'number') {
                product = productsData[String(productId)];
            }

            // デバッグ: 商品が見つからない場合
            if (!product) {
                console.warn('Product not found for item:', {
                    productId: productId,
                    productIdType: typeof productId,
                    availableProductIds: Object.keys(productsData).slice(0, 5),
                    item: item
                });
            }

            const imageUrl = product && product.images && product.images.length > 0
                ? product.images[0]
                : '';

            return `
                <div style="width: 80px; height: 80px; background: #f5f5f5; border-radius: 5px; overflow: hidden; border: 1px solid #eee;">
                    ${imageUrl ? `
                        <img src="${imageUrl}" alt="${product ? product.name : '商品'}"
                             style="width: 100%; height: 100%; object-fit: cover;">
                    ` : `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
                            <i class="fas fa-image" style="color: #ddd; font-size: 24px;"></i>
                        </div>
                    `}
                </div>
            `;
        }).join('');

        const moreItems = order.items.length > 3 ? `<p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">他${order.items.length - 3}点</p>` : '';

        return `
            <div class="order-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fff;">
                <div class="order-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <p style="color: #999; font-size: 14px; margin-bottom: 5px;">注文日: ${formattedDate}</p>
                        <p style="font-weight: bold; font-size: 16px;">注文番号: ${order.orderId}</p>
                    </div>
                    <span class="order-status" style="background: ${statusInfo.color}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; white-space: nowrap;">
                        ${statusInfo.label}
                    </span>
                </div>

                <div class="order-items" style="margin-bottom: 15px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                        ${itemsHTML}
                    </div>
                    ${moreItems}
                    <p style="font-weight: bold; font-size: 18px; color: #333; margin-top: 10px;">合計: ¥${order.totalAmount.toLocaleString()}</p>
                </div>

                <div class="order-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-order-detail btn-cmn-01" data-order-id="${order.orderId}" style="width: 100%;">
                        <i class="fas fa-info-circle"></i> 詳細を見る
                    </button>
                </div>
            </div>
        `;
    }

    // ステータス情報を取得
    function getStatusInfo(status) {
        const statusMap = {
            '準備中': { label: '準備中', color: '#FFA726' },
            '発送完了': { label: '発送完了', color: '#2196F3' },
            'キャンセル': { label: 'キャンセル', color: '#EF5350' }
        };
        return statusMap[status] || { label: '不明', color: '#999' };
    }

    // 注文詳細を表示
    function showOrderDetail(orderId) {
        const order = ordersData.find(o => o.orderId === orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }

        const orderDate = new Date(order.orderDate);
        const formattedDate = `${orderDate.getFullYear()}年${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;
        const statusInfo = getStatusInfo(order.status);

        const orderDetailContent = document.getElementById('orderDetailContent');
        orderDetailContent.innerHTML = `
            <h3 style="margin-bottom: 20px;">注文詳細</h3>

            <div style="margin-bottom: 20px;">
                <p style="color: #999; margin-bottom: 5px;">注文番号</p>
                <p style="font-weight: bold;">${order.orderId}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="color: #999; margin-bottom: 5px;">注文日</p>
                <p>${formattedDate}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="color: #999; margin-bottom: 5px;">ステータス</p>
                <span style="background: ${statusInfo.color}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                    ${statusInfo.label}
                </span>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="color: #999; margin-bottom: 10px;">注文商品</p>
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px;">
                    ${order.items.map(item => {
                        // productIdを文字列と数値の両方で試す
                        const productId = item.productId;
                        let product = productsData[productId];

                        // 文字列/数値の変換を試みる
                        if (!product && typeof productId === 'string') {
                            product = productsData[parseInt(productId)];
                        } else if (!product && typeof productId === 'number') {
                            product = productsData[String(productId)];
                        }

                        if (!product) {
                            // 商品が見つからない場合は注文データに保存されている情報を使用
                            return `
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                                    <div style="flex: 1;">
                                        <p style="font-weight: bold;">${item.name || '商品情報なし'}</p>
                                        <p style="color: #666; font-size: 14px;">数量: ${item.quantity}</p>
                                    </div>
                                    <p style="font-weight: bold;">¥${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            `;
                        }
                        return `
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                                <div style="flex: 1;">
                                    <p style="font-weight: bold;">${product.name}</p>
                                    <p style="color: #666; font-size: 14px;">数量: ${item.quantity}</p>
                                </div>
                                <p style="font-weight: bold;">¥${(product.price * item.quantity).toLocaleString()}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="color: #999; margin-bottom: 5px;">配送先</p>
                <div style="padding: 15px; background: #f9f9f9; border-radius: 5px;">
                    <p>${order.shippingAddress.name}</p>
                    <p style="margin-top: 5px;">〒${order.shippingAddress.postalCode}</p>
                    <p>${order.shippingAddress.prefecture}${order.shippingAddress.city}${order.shippingAddress.address1}</p>
                    ${order.shippingAddress.address2 ? `<p>${order.shippingAddress.address2}</p>` : ''}
                    <p style="margin-top: 5px;">電話: ${order.shippingAddress.phone}</p>
                </div>
            </div>

            <div style="border-top: 2px solid #333; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                    <span>合計金額</span>
                    <span>¥${order.totalAmount.toLocaleString()}</span>
                </div>
            </div>
        `;

        const modal = document.getElementById('orderDetailModal');
        modal.classList.add('active');
        modal.querySelector('.modal-cmn-container').classList.add('active');
    }

    // モーダル初期化
    function initializeModal() {
        const modal = document.getElementById('orderDetailModal');
        const closeBtn = document.getElementById('closeOrderDetailModal');

        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            modal.querySelector('.modal-cmn-container').classList.remove('active');
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.querySelector('.modal-cmn-container').classList.remove('active');
            }
        });
    }

})();
