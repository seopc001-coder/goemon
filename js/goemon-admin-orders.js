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
    loadOrders();
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
        'shipping': '配送中',
        'completed': '配送完了',
        'cancelled': 'キャンセル'
    };

    // 英語のステータスを日本語に変換
    if (statusMap[order.status]) {
        order.status = statusMap[order.status];
    }

    return order;
}

// 注文データを読み込み
function loadOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];

        // ステータスを日本語に正規化
        orders.forEach(order => normalizeOrderStatus(order));

        // localStorageに正規化されたデータを保存
        localStorage.setItem('goemonorders', JSON.stringify(orders));

        // 注文を日付順にソート（新しい順）
        allOrders = orders.sort((a, b) => {
            return new Date(b.orderDate) - new Date(a.orderDate);
        });

        filteredOrders = [...allOrders];

        renderOrders(filteredOrders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlertModal('注文データの読み込みに失敗しました', 'error');
    }
}

// 注文リストを表示
function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');

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
                <td>${order.customerName || 'ゲスト'}</td>
                <td>${order.customerEmail || 'N/A'}</td>
                <td><strong>¥${(order.totalAmount || 0).toLocaleString()}</strong></td>
                <td>
                    <span class="status-badge ${statusClass}">${order.status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="viewOrderDetail('${order.orderId}')">
                            <i class="fas fa-eye"></i> 詳細
                        </button>
                        <button class="btn-small btn-edit" onclick="editOrderStatus('${order.orderId}')">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ステータスクラスを取得
function getStatusClass(status) {
    const statusMap = {
        '準備中': 'pending',
        '配送中': 'shipping',
        '配送完了': 'completed',
        'キャンセル': 'cancelled'
    };
    return statusMap[status] || 'pending';
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
    const order = allOrders.find(o => o.orderId === orderId);

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
                <div>${order.customerName || 'ゲスト'}</div>

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
            <select class="status-select" id="newStatusSelect">
                <option value="準備中" ${order.status === '準備中' ? 'selected' : ''}>準備中</option>
                <option value="配送中" ${order.status === '配送中' ? 'selected' : ''}>配送中</option>
                <option value="配送完了" ${order.status === '配送完了' ? 'selected' : ''}>配送完了</option>
                <option value="キャンセル" ${order.status === 'キャンセル' ? 'selected' : ''}>キャンセル</option>
            </select>
            <button class="btn-cmn-02" onclick="updateOrderStatus('${order.orderId}')" style="width: 100%;">
                <i class="fas fa-save"></i> ステータスを更新
            </button>
        </div>
    `;

    modal.classList.add('active');
}

// 注文ステータスを編集（クイック編集）
function editOrderStatus(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);

    if (!order) {
        showAlertModal('注文が見つかりません', 'error');
        return;
    }

    // 詳細モーダルを表示
    viewOrderDetail(orderId);
}

// 注文ステータスを更新
function updateOrderStatus(orderId) {
    const newStatus = document.getElementById('newStatusSelect').value;
    const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];

    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
        showAlertModal('注文が見つかりません', 'error');
        return;
    }

    // ステータスを更新
    orders[orderIndex].status = newStatus;

    // localStorageに保存
    localStorage.setItem('goemonorders', JSON.stringify(orders));

    // データを再読み込み
    loadOrders();

    // モーダルを閉じる
    closeOrderDetailModal();

    // 成功メッセージ
    showAlertModal(`注文 #${orderId} のステータスを「${newStatus}」に更新しました`, 'success');
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
