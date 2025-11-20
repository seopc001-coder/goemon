// 五右衛門 ECサイト - 注文履歴ページ JavaScript
(function() {
    'use strict';

    let ordersData = [];
    let productsData = {};
    let currentUser = null;

    // 商品データを初期化
    function initializeProductsData() {
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
    }

    document.addEventListener('DOMContentLoaded', async function() {
        // 商品データを初期化
        initializeProductsData();

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
                // Supabaseから注文履歴を取得（未実装のため、localStorageから読み込み）
                loadOrdersFromLocalStorage();
            }

            renderOrders();
        } catch (error) {
            console.error('Error checking login status:', error);
            loadOrdersFromLocalStorage();
            renderOrders();
        }
    }

    // localStorageから注文履歴を読み込み
    function loadOrdersFromLocalStorage() {
        const savedOrders = localStorage.getItem('goemonorders');
        if (savedOrders) {
            try {
                ordersData = JSON.parse(savedOrders);
                console.log('Loaded orders from localStorage:', ordersData);
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

        // 商品の画像とサマリー
        const itemsSummary = order.items.slice(0, 3).map(item => {
            const product = productsData[item.productId];
            return product ? product.name : '商品';
        }).join('、');

        const moreItems = order.items.length > 3 ? ` 他${order.items.length - 3}点` : '';

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
                    <p style="color: #666; margin-bottom: 5px;"><i class="fas fa-box"></i> ${itemsSummary}${moreItems}</p>
                    <p style="font-weight: bold; font-size: 18px; color: #333;">合計: ¥${order.totalAmount.toLocaleString()}</p>
                </div>

                <div class="order-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-order-detail btn-cmn-01" data-order-id="${order.orderId}" style="flex: 1; min-width: 120px;">
                        <i class="fas fa-info-circle"></i> 詳細を見る
                    </button>
                    ${order.status === '配送完了' ? `
                        <button class="btn-reorder btn-cmn-02" data-order-id="${order.orderId}" style="flex: 1; min-width: 120px;">
                            <i class="fas fa-redo"></i> 再注文
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ステータス情報を取得
    function getStatusInfo(status) {
        const statusMap = {
            '準備中': { label: '準備中', color: '#FFA726' },
            '配送中': { label: '配送中', color: '#66BB6A' },
            '配送完了': { label: '配送完了', color: '#4CAF50' },
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
                        const product = productsData[item.productId];
                        if (!product) return '';
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
