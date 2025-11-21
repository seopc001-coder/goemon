// ===================================
// 五右衛門 ECサイト - 注文管理 (Supabase版)
// ===================================

console.log('goemon-admin-orders-v2.js loaded');

let allOrders = [];
let filteredOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Orders Management');
    initializeOrders();
});

async function initializeOrders() {
    // 管理者権限チェック
    await checkAdminAccess();

    // Supabaseから注文を読み込み
    await loadOrders();

    // イベントリスナー設定
    document.getElementById('statusFilter')?.addEventListener('change', filterOrders);
    document.getElementById('orderSearch')?.addEventListener('input', searchOrders);
    document.getElementById('searchOrderBtn')?.addEventListener('click', searchOrders);

    console.log('Orders management initialized');
}

/**
 * 注文をSupabaseから読み込み
 */
async function loadOrders() {
    try {
        console.log('📥 Supabaseから注文を取得中...');
        allOrders = await fetchAllOrders();
        console.log('✅ 注文取得完了:', allOrders.length, '件');
        filteredOrders = [...allOrders];
        renderOrders();
        updateStatistics();
    } catch (error) {
        console.error('注文読み込みエラー:', error);
        showAlertModal('注文データの読み込みに失敗しました', 'error');
    }
}

/**
 * 注文を表示
 */
function renderOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    if (filteredOrders.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>注文がありません</h3>
                <p>新しい注文が入るとここに表示されます</p>
            </div>
        `;
        return;
    }

    // 作成日時の降順でソート
    const sortedOrders = [...filteredOrders].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    list.innerHTML = sortedOrders.map(order => `
        <div class="order-item" data-id="${order.id}">
            <div class="order-header">
                <div class="order-number">
                    <i class="fas fa-receipt"></i>
                    ${order.order_number}
                </div>
                <span class="order-status-badge status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
            </div>
            <div class="order-body">
                <div class="order-info">
                    <p class="order-customer">
                        <i class="fas fa-user"></i>
                        ${order.shipping_family_name} ${order.shipping_given_name}
                    </p>
                    <p class="order-email">
                        <i class="fas fa-envelope"></i>
                        ${order.purchaser_email}
                    </p>
                    <p class="order-date">
                        <i class="fas fa-calendar"></i>
                        ${formatDateTime(order.created_at)}
                    </p>
                </div>
                <div class="order-summary">
                    <p class="order-total">合計: ¥${order.total.toLocaleString()}</p>
                    <p class="order-items-count">
                        ${order.order_items ? order.order_items.length : 0}点
                    </p>
                    ${order.payment_method ? `<p class="order-payment"><i class="fas fa-credit-card"></i> ${getPaymentMethodText(order.payment_method)}</p>` : ''}
                </div>
            </div>
            <div class="order-actions">
                <button class="btn-small btn-view" onclick="viewOrderDetail('${order.id}')">
                    <i class="fas fa-eye"></i> 詳細
                </button>
                <button class="btn-small btn-edit" onclick="changeOrderStatus('${order.id}')">
                    <i class="fas fa-edit"></i> ステータス変更
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * 注文詳細を表示
 */
window.viewOrderDetail = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showAlertModal('注文が見つかりません', 'error');
        return;
    }

    const items = order.order_items || [];
    const itemsHtml = items.map(item => `
        <div class="order-detail-item">
            <div class="item-name">${item.product_name}</div>
            <div class="item-quantity">x${item.quantity}</div>
            <div class="item-price">¥${item.product_price.toLocaleString()}</div>
            <div class="item-subtotal">¥${item.subtotal.toLocaleString()}</div>
        </div>
    `).join('');

    const detailHtml = `
        <div class="order-detail-container">
            <h2>注文番号: ${order.order_number}</h2>

            <div class="order-detail-section">
                <h3><i class="fas fa-user"></i> 購入者情報</h3>
                <p>氏名: ${order.purchaser_family_name} ${order.purchaser_given_name} (${order.purchaser_family_name_kana} ${order.purchaser_given_name_kana})</p>
                <p>電話番号: ${order.purchaser_phone}</p>
                <p>メールアドレス: ${order.purchaser_email}</p>
            </div>

            <div class="order-detail-section">
                <h3><i class="fas fa-shipping-fast"></i> 配送先情報</h3>
                <p>氏名: ${order.shipping_family_name} ${order.shipping_given_name} (${order.shipping_family_name_kana} ${order.shipping_given_name_kana})</p>
                <p>電話番号: ${order.shipping_phone}</p>
                <p>郵便番号: 〒${order.shipping_postal_code}</p>
                <p>住所: ${order.shipping_prefecture}${order.shipping_city}${order.shipping_address1} ${order.shipping_address2 || ''}</p>
                ${order.delivery_date ? `<p>配送希望日: ${order.delivery_date}</p>` : ''}
                ${order.delivery_time ? `<p>配送希望時間: ${order.delivery_time}</p>` : ''}
            </div>

            <div class="order-detail-section">
                <h3><i class="fas fa-shopping-bag"></i> 注文商品</h3>
                ${itemsHtml}
            </div>

            <div class="order-detail-section">
                <h3><i class="fas fa-calculator"></i> 金額詳細</h3>
                <div class="order-price-breakdown">
                    <div class="price-row">
                        <span>小計</span>
                        <span>¥${order.subtotal.toLocaleString()}</span>
                    </div>
                    <div class="price-row">
                        <span>送料</span>
                        <span>¥${order.shipping_fee.toLocaleString()}</span>
                    </div>
                    ${order.discount ? `
                        <div class="price-row">
                            <span>割引</span>
                            <span>-¥${order.discount.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    <div class="price-row">
                        <span>消費税</span>
                        <span>¥${order.tax.toLocaleString()}</span>
                    </div>
                    <div class="price-row total">
                        <span>合計</span>
                        <span>¥${order.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            ${order.notes ? `
                <div class="order-detail-section">
                    <h3><i class="fas fa-comment"></i> 備考</h3>
                    <p>${order.notes}</p>
                </div>
            ` : ''}

            <div class="order-detail-section">
                <h3><i class="fas fa-info-circle"></i> その他情報</h3>
                <p>支払い方法: ${getPaymentMethodText(order.payment_method)}</p>
                <p>注文日時: ${formatDateTime(order.created_at)}</p>
                <p>ステータス: <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></p>
            </div>
        </div>
    `;

    showAlertModal(detailHtml, 'info', true);
};

/**
 * 注文ステータス変更
 */
window.changeOrderStatus = async function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const statuses = [
        { value: 'pending', label: '保留中' },
        { value: 'processing', label: '処理中' },
        { value: 'shipped', label: '発送済み' },
        { value: 'delivered', label: '配達完了' },
        { value: 'cancelled', label: 'キャンセル' }
    ];

    const options = statuses.map(s =>
        `<option value="${s.value}" ${s.value === order.status ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const html = `
        <div class="status-change-form">
            <p>注文番号: ${order.order_number}</p>
            <label for="newStatus">新しいステータス:</label>
            <select id="newStatus" class="form-control">
                ${options}
            </select>
        </div>
    `;

    if (confirm('ステータスを変更しますか？')) {
        const newStatus = prompt('新しいステータスを入力してください\n(pending/processing/shipped/delivered/cancelled):', order.status);
        if (newStatus && newStatus !== order.status) {
            try {
                console.log('🔄 注文ステータスを更新中...', orderId, newStatus);
                await updateOrderStatus(orderId, newStatus);
                showAlertModal('ステータスを更新しました', 'success');
                await loadOrders();
            } catch (error) {
                console.error('ステータス更新エラー:', error);
                showAlertModal('ステータスの更新に失敗しました: ' + error.message, 'error');
            }
        }
    }
};

/**
 * 注文をフィルタ
 */
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    if (statusFilter === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => order.status === statusFilter);
    }

    renderOrders();
    updateStatistics();
}

/**
 * 注文を検索
 */
function searchOrders() {
    const searchTerm = document.getElementById('orderSearch')?.value.toLowerCase() || '';

    filteredOrders = allOrders.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm) ||
        order.purchaser_email.toLowerCase().includes(searchTerm) ||
        `${order.shipping_family_name} ${order.shipping_given_name}`.toLowerCase().includes(searchTerm)
    );

    renderOrders();
}

/**
 * 統計情報を更新
 */
function updateStatistics() {
    const stats = {
        total: filteredOrders.length,
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        processing: filteredOrders.filter(o => o.status === 'processing').length,
        shipped: filteredOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
        totalRevenue: filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };

    document.getElementById('totalOrders')?.textContent = stats.total;
    document.getElementById('pendingOrders')?.textContent = stats.pending;
    document.getElementById('processingOrders')?.textContent = stats.processing;
    document.getElementById('shippedOrders')?.textContent = stats.shipped;
    document.getElementById('totalRevenue')?.textContent = `¥${stats.totalRevenue.toLocaleString()}`;
}

/**
 * ステータステキスト取得
 */
function getStatusText(status) {
    const statusMap = {
        'pending': '保留中',
        'processing': '処理中',
        'shipped': '発送済み',
        'delivered': '配達完了',
        'cancelled': 'キャンセル'
    };
    return statusMap[status] || status;
}

/**
 * 支払い方法テキスト取得
 */
function getPaymentMethodText(method) {
    const methodMap = {
        'credit_card': 'クレジットカード',
        'bank_transfer': '銀行振込',
        'cod': '代金引換',
        'convenience': 'コンビニ決済'
    };
    return methodMap[method] || method;
}

/**
 * 日時フォーマット
 */
function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
