// 五右衛門 ECサイト - 注文管理 JavaScript

let allOrders = [];
let filteredOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeOrderManagement();
});

async function initializeOrderManagement() {
    // 管理者権限チェック
    await checkAdminAccess();

    // 注文データを読み込み
    await loadOrders();

    // ダッシュボードから遷移してきた場合、該当注文の詳細を表示
    const viewOrderId = sessionStorage.getItem('viewOrderId');
    if (viewOrderId) {
        sessionStorage.removeItem('viewOrderId');
        // データ読み込み後に詳細を表示
        setTimeout(() => {
            viewOrderDetail(viewOrderId);
        }, 100);
    }
}

// 管理者権限チェック
async function checkAdminAccess() {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated');

    if (adminAuthenticated !== 'true') {
        window.location.href = 'goemon-admin-login.html';
        return;
    }

    const adminId = sessionStorage.getItem('adminId');
    console.log('Admin access granted for:', adminId);
}

// ステータスを日本語に変換
function normalizeOrderStatus(order) {
    const statusMap = {
        'pending': '準備中',
        'processing': '準備中',
        'shipped': '発送完了',
        'delivered': '発送完了',
        'shipping': '発送完了',
        'completed': '発送完了',
        'cancelled': 'キャンセル'
    };

    // 英語のステータスを日本語に変換
    if (statusMap[order.status]) {
        order.status = statusMap[order.status];
    }

    return order;
}

// 注文データを読み込み
async function loadOrders() {
    try {
        // Supabaseから全注文を取得
        const dbOrders = await fetchAllOrders();

        // DB注文データをアプリ用フォーマットに変換
        allOrders = dbOrders.map(order => ({
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
            totalAmount: order.total,
            dbId: order.id // Supabase上のID
        }));

        // 注文を日付順にソート（新しい順）
        allOrders.sort((a, b) => {
            return new Date(b.orderDate) - new Date(a.orderDate);
        });

        filteredOrders = [...allOrders];

        console.log('Loaded orders from Supabase:', allOrders.length);
        renderOrders(filteredOrders);
    } catch (error) {
        console.error('Error loading orders from Supabase:', error);
        // エラー時はlocalStorageから読み込み（フォールバック）
        loadOrdersFromLocalStorage();
    }
}

// localStorageから注文を読み込み（フォールバック用）
function loadOrdersFromLocalStorage() {
    try {
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];

        // ステータスを日本語に正規化
        orders.forEach(order => normalizeOrderStatus(order));

        allOrders = orders.sort((a, b) => {
            return new Date(b.orderDate) - new Date(a.orderDate);
        });

        filteredOrders = [...allOrders];

        console.log('Loaded orders from localStorage:', allOrders.length);
        renderOrders(filteredOrders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlertModal('注文データの読み込みに失敗しました', 'error');
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

// 注文リストを表示
function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');

    // 完了率を計算・表示
    updateCompletionRate(orders);

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    条件に一致する注文がありません
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const orderDate = new Date(order.orderDate);
        const statusClass = getStatusClass(order.status);

        return `
            <tr>
                <td><strong>#${order.orderId}</strong></td>
                <td>${formatDateTime(orderDate)}</td>
                <td>${getCustomerName(order)}</td>
                <td>${order.customerEmail || 'N/A'}</td>
                <td><strong>¥${(order.totalAmount || 0).toLocaleString()}</strong></td>
                <td>
                    <span class="status-badge ${statusClass}">${order.status}</span>
                </td>
                <td>
                    <button class="btn-small btn-view" onclick="viewOrderDetail('${order.orderId}')">
                        <i class="fas fa-eye"></i> 詳細
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ステータスクラスを取得
function getStatusClass(status) {
    const statusMap = {
        '準備中': 'pending',
        '発送完了': 'completed',
        'キャンセル': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

// 顧客名を取得（姓名形式）
function getCustomerName(order) {
    // shippingAddressにlastNameとfirstNameがある場合
    if (order.shippingAddress && order.shippingAddress.lastName && order.shippingAddress.firstName) {
        return `${order.shippingAddress.lastName} ${order.shippingAddress.firstName}`;
    }

    // customerNameがある場合
    if (order.customerName) {
        return order.customerName;
    }

    // shippingAddress.nameがある場合
    if (order.shippingAddress && order.shippingAddress.name) {
        return order.shippingAddress.name;
    }

    return 'ゲスト';
}

// 日時をフォーマット
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// フィルターを適用
function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const searchKeyword = document.getElementById('filterSearch').value.trim().toLowerCase();

    filteredOrders = allOrders.filter(order => {
        // ステータスフィルター
        if (status && order.status !== status) {
            return false;
        }

        // 日付フィルター（開始）
        if (dateFrom) {
            const orderDate = new Date(order.orderDate);
            const fromDate = new Date(dateFrom);
            if (orderDate < fromDate) {
                return false;
            }
        }

        // 日付フィルター（終了）
        if (dateTo) {
            const orderDate = new Date(order.orderDate);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // 終了日の23:59:59まで
            if (orderDate > toDate) {
                return false;
            }
        }

        // 検索キーワード
        if (searchKeyword) {
            const orderId = order.orderId.toLowerCase();
            const customerName = (order.customerName || '').toLowerCase();

            if (!orderId.includes(searchKeyword) && !customerName.includes(searchKeyword)) {
                return false;
            }
        }

        return true;
    });

    renderOrders(filteredOrders);
}

// フィルターをリセット
function resetFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterSearch').value = '';

    filteredOrders = [...allOrders];
    renderOrders(filteredOrders);
}

// 注文詳細を表示
function viewOrderDetail(orderId) {
    // order.dbId (UUID) または order.orderId (注文番号) で検索
    const order = allOrders.find(o => o.dbId === orderId || o.orderId === orderId);

    if (!order) {
        showAlertModal('注文が見つかりません', 'error');
        return;
    }

    const modal = document.getElementById('orderDetailModal');
    const modalTitle = document.getElementById('modalOrderTitle');
    const modalBody = document.getElementById('orderDetailBody');

    modalTitle.innerHTML = `
        <i class="fas fa-file-invoice"></i> 注文詳細 - #${order.orderId}
    `;

    modalBody.innerHTML = `
        <!-- 注文情報 -->
        <div class="detail-section">
            <h3><i class="fas fa-info-circle"></i> 注文情報</h3>
            <div class="detail-grid">
                <div class="detail-label">注文番号:</div>
                <div><strong>#${order.orderId}</strong></div>

                <div class="detail-label">注文日時:</div>
                <div>${formatDateTime(new Date(order.orderDate))}</div>

                <div class="detail-label">ステータス:</div>
                <div>
                    <span class="status-badge ${getStatusClass(order.status)}">${order.status}</span>
                </div>

                <div class="detail-label">支払方法:</div>
                <div>${order.paymentMethod || 'クレジットカード'}</div>
            </div>
        </div>

        <!-- 顧客情報 -->
        <div class="detail-section">
            <h3><i class="fas fa-user"></i> 顧客情報</h3>
            <div class="detail-grid">
                <div class="detail-label">氏名:</div>
                <div>${getCustomerName(order)}</div>

                <div class="detail-label">メールアドレス:</div>
                <div>${order.customerEmail || 'N/A'}</div>

                ${order.shippingAddress ? `
                    <div class="detail-label">配送先住所:</div>
                    <div>
                        〒${order.shippingAddress.postalCode || ''}<br>
                        ${order.shippingAddress.prefecture || ''}${order.shippingAddress.city || ''}${order.shippingAddress.address1 || ''}<br>
                        ${order.shippingAddress.address2 || ''}
                    </div>

                    <div class="detail-label">電話番号:</div>
                    <div>${order.shippingAddress.phone || 'N/A'}</div>
                ` : ''}
            </div>
        </div>

        <!-- 注文商品 -->
        <div class="detail-section">
            <h3><i class="fas fa-box"></i> 注文商品</h3>
            <div class="items-list">
                ${order.items.map(item => `
                    <div class="item-row">
                        <div class="item-info">
                            <div><strong>${item.name}</strong></div>
                            <div style="color: #666; font-size: 14px;">
                                数量: ${item.quantity} × ¥${(item.price || 0).toLocaleString()}
                            </div>
                        </div>
                        <div class="item-price">
                            ¥${((item.price || 0) * item.quantity).toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- 合計金額 -->
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>小計:</span>
                    <strong>¥${(order.subtotal || 0).toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>送料:</span>
                    <strong>¥${(order.shipping || 0).toLocaleString()}</strong>
                </div>
                ${order.discount ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #f44336;">
                        <span>割引:</span>
                        <strong>-¥${order.discount.toLocaleString()}</strong>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd; font-size: 18px;">
                    <span>合計:</span>
                    <strong style="color: #f44336;">¥${(order.totalAmount || 0).toLocaleString()}</strong>
                </div>
            </div>
        </div>

        <!-- ステータス更新 -->
        <div class="status-update-section">
            <h3 style="font-size: 16px; margin-bottom: 15px;">
                <i class="fas fa-sync-alt"></i> ステータス更新
            </h3>
            <select class="status-select" id="newStatusSelect" onchange="toggleTrackingNumberField()">
                <option value="準備中" ${order.status === '準備中' ? 'selected' : ''}>準備中</option>
                <option value="発送完了" ${order.status === '発送完了' ? 'selected' : ''}>発送完了</option>
                <option value="キャンセル" ${order.status === 'キャンセル' ? 'selected' : ''}>キャンセル</option>
            </select>

            <!-- 送り状番号入力フィールド -->
            <div id="trackingNumberField" style="display: none; margin-top: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                    送り状番号 <span style="color: red;">*</span>
                </label>
                <input type="text" id="trackingNumberInput" class="form-input"
                       placeholder="送り状番号を入力してください"
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>

            <button class="btn-cmn-02" onclick="updateOrderStatusUI('${order.orderId}')" style="width: 100%; margin-top: 15px;">
                <i class="fas fa-save"></i> ステータスを更新
            </button>
        </div>
    `;

    modal.classList.add('active');
}

// 送り状番号フィールドの表示切り替え
function toggleTrackingNumberField() {
    const newStatus = document.getElementById('newStatusSelect').value;
    const trackingField = document.getElementById('trackingNumberField');

    if (newStatus === '発送完了') {
        trackingField.style.display = 'block';
    } else {
        trackingField.style.display = 'none';
    }
}

// 注文ステータスを更新
async function updateOrderStatusUI(orderId) {
    const newStatus = document.getElementById('newStatusSelect').value;
    const trackingNumberInput = document.getElementById('trackingNumberInput');
    const trackingNumber = trackingNumberInput ? trackingNumberInput.value.trim() : '';

    // 発送完了の場合、送り状番号のバリデーション
    if (newStatus === '発送完了' && !trackingNumber) {
        showAlertModal('発送完了にするには送り状番号を入力してください', 'error');
        return;
    }

    // メモリ上の注文を検索
    const order = allOrders.find(o => o.orderId === orderId);

    if (!order) {
        showAlertModal('注文が見つかりません', 'error');
        return;
    }

    try {
        // 日本語ステータスを英語にマッピング
        const statusMapReverse = {
            '準備中': 'pending',
            '発送完了': 'delivered',
            'キャンセル': 'cancelled'
        };
        const dbStatus = statusMapReverse[newStatus] || 'pending';
        const oldStatus = order.status;

        console.log('📝 注文ステータスを更新:', orderId, '→', newStatus, '(DB:', dbStatus, ')');

        // キャンセル時の在庫復元と売上調整
        if (newStatus === 'キャンセル' && oldStatus !== 'キャンセル') {
            try {
                // 在庫復元
                console.log('🔄 在庫復元処理を開始');
                for (const item of order.items) {
                    await restoreProductStock(item.productId, item.quantity, item.color, item.size);
                }
                console.log('✅ 在庫復元完了');

                // 売上調整（注文日の売上をマイナス）
                console.log('💰 売上調整処理を開始（注文日:', new Date(order.orderDate).toLocaleDateString(), ')');
                // 売上調整はSupabaseで直接行うため、ここではログのみ
                // 実際の売上調整はupdateOrderStatusWithCancellation関数内で行います

            } catch (restoreError) {
                console.error('❌ 在庫復元/売上調整エラー:', restoreError);
                showAlertModal('在庫復元または売上調整に失敗しました: ' + restoreError.message, 'error');
                return;
            }
        }

        // Supabaseで更新（dbIdを使用、送り状番号とキャンセル処理を含む）
        if (order.dbId) {
            if (newStatus === 'キャンセル' && oldStatus !== 'キャンセル') {
                // キャンセルの場合は専用関数を使用（売上調整含む）
                await updateOrderStatusWithCancellation(order.dbId, dbStatus, order.totalAmount, order.orderDate);
            } else {
                // 通常のステータス更新（送り状番号を含む）
                await updateOrderStatusWithTracking(order.dbId, dbStatus, trackingNumber);
            }
            console.log('✅ Supabaseで注文ステータス更新完了:', order.dbId);
        } else {
            console.warn('⚠️ dbIdが見つかりません。Supabaseへの保存をスキップします');
        }

        // ステータスが「発送完了」に変更された場合、ポイントを付与
        if (oldStatus !== '発送完了' && newStatus === '発送完了' && order.customerId && order.subtotal) {
            try {
                console.log('🎁 ポイント付与処理を開始:', {
                    userId: order.customerId,
                    amount: order.subtotal,
                    orderId: order.dbId
                });

                const pointsAwarded = await awardPurchasePoints(
                    order.customerId,
                    order.subtotal,
                    order.dbId
                );

                console.log(`✅ ポイント付与完了: ${pointsAwarded}pt`);
            } catch (pointError) {
                console.error('❌ ポイント付与エラー:', pointError);
                // ポイント付与失敗はステータス更新を妨げない
                showAlertModal(`ステータスは更新されましたが、ポイント付与に失敗しました: ${pointError.message}`, 'warning');
            }
        }

        // メモリ上のステータスを更新
        order.status = newStatus;

        // データを再読み込み
        await loadOrders();

        // モーダルを閉じる
        closeOrderDetailModal();

        // 成功メッセージ
        let successMessage = `注文 #${orderId} のステータスを「${newStatus}」に更新しました`;
        if (oldStatus !== '発送完了' && newStatus === '発送完了') {
            successMessage += '\n購入ポイントを付与しました';
        }
        if (newStatus === 'キャンセル') {
            successMessage += '\n在庫を復元し、売上を調整しました';
        }
        showAlertModal(successMessage, 'success');

    } catch (error) {
        console.error('❌ 注文ステータス更新エラー:', error);
        showAlertModal('ステータスの更新に失敗しました: ' + error.message, 'error');
    }
}

// 在庫を復元する関数
async function restoreProductStock(productId, quantity, color, size) {
    try {
        // 商品データを取得
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        // バリエーション商品の場合
        if (product.variants && product.variants.stock && color) {
            const variantStock = product.variants.stock;
            if (variantStock[color] !== undefined) {
                variantStock[color] += quantity;

                // 更新
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ variants: product.variants })
                    .eq('id', productId);

                if (updateError) throw updateError;
                console.log(`✅ バリエーション在庫復元: ${productId} (${color}) +${quantity}`);
            }
        } else {
            // 通常商品の場合
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: product.stock + quantity })
                .eq('id', productId);

            if (updateError) throw updateError;
            console.log(`✅ 在庫復元: ${productId} +${quantity}`);
        }
    } catch (error) {
        console.error('在庫復元エラー:', productId, error);
        throw error;
    }
}

// 完了率を更新
function updateCompletionRate(orders) {
    const totalOrders = orders.length;

    if (totalOrders === 0) {
        document.getElementById('completionRate').textContent = '0%';
        return;
    }

    const completedOrders = orders.filter(order => {
        return order.status === '発送完了' || order.status === 'delivered' || order.status === 'completed';
    }).length;

    const completionRate = Math.round((completedOrders / totalOrders) * 100);
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// 注文詳細モーダルを閉じる
function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    modal.classList.remove('active');
}

// モーダル外クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('orderDetailModal');

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeOrderDetailModal();
            }
        });
    }
});
