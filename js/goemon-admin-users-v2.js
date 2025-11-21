// ===================================
// 五右衛門 ECサイト - ユーザー管理 (Supabase版)
// ===================================

console.log('goemon-admin-users-v2.js loaded');

let allUsers = [];
let filteredUsers = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Users Management');
    initializeUsers();
});

async function initializeUsers() {
    // 管理者権限チェック
    await checkAdminAccess();

    // Supabaseからユーザーを読み込み
    await loadUsers();

    // イベントリスナー設定
    document.getElementById('userSearch')?.addEventListener('input', searchUsers);
    document.getElementById('searchUserBtn')?.addEventListener('click', searchUsers);
    document.getElementById('statusFilter')?.addEventListener('change', filterUsers);

    console.log('Users management initialized');
}

/**
 * ユーザーをSupabaseから読み込み
 */
async function loadUsers() {
    try {
        console.log('📥 Supabaseからユーザーを取得中...');
        allUsers = await fetchAllUsers();
        console.log('✅ ユーザー取得完了:', allUsers.length, '件');
        filteredUsers = [...allUsers];
        renderUsers();
        updateStatistics();
    } catch (error) {
        console.error('ユーザー読み込みエラー:', error);
        showAlertModal('ユーザーデータの読み込みに失敗しました', 'error');
    }
}

/**
 * ユーザーを表示
 */
function renderUsers() {
    const list = document.getElementById('usersList');
    if (!list) return;

    if (filteredUsers.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>ユーザーがいません</h3>
                <p>新規登録されたユーザーがここに表示されます</p>
            </div>
        `;
        return;
    }

    // 登録日時の降順でソート
    const sortedUsers = [...filteredUsers].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    list.innerHTML = sortedUsers.map(user => {
        const status = user.user_metadata?.status || 'active';
        const isWithdrawn = status === 'withdrawn';

        return `
            <div class="user-item ${isWithdrawn ? 'withdrawn' : ''}" data-id="${user.id}">
                <div class="user-header">
                    <div class="user-info-main">
                        <div class="user-name">
                            ${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}
                        </div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <span class="user-status-badge ${isWithdrawn ? 'status-withdrawn' : 'status-active'}">
                        ${isWithdrawn ? '退会済み' : 'アクティブ'}
                    </span>
                </div>
                <div class="user-body">
                    <div class="user-meta">
                        <p><i class="fas fa-calendar"></i> 登録日: ${formatDate(user.created_at)}</p>
                        <p><i class="fas fa-shopping-bag"></i> 注文数: ${user.order_count || 0}件</p>
                        ${isWithdrawn ? `<p><i class="fas fa-user-times"></i> 退会日: ${formatDate(user.user_metadata?.deleted_at)}</p>` : ''}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-small btn-view" onclick="viewUserDetail('${user.id}')">
                        <i class="fas fa-eye"></i> 詳細
                    </button>
                    ${!isWithdrawn ? `
                        <button class="btn-small btn-orders" onclick="viewUserOrders('${user.id}')">
                            <i class="fas fa-list"></i> 注文履歴
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * ユーザー詳細を表示
 */
window.viewUserDetail = async function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showAlertModal('ユーザーが見つかりません', 'error');
        return;
    }

    const status = user.user_metadata?.status || 'active';
    const isWithdrawn = status === 'withdrawn';

    const detailHtml = `
        <div class="user-detail-container">
            <h2>ユーザー詳細</h2>

            <div class="user-detail-section">
                <h3><i class="fas fa-user"></i> 基本情報</h3>
                <p>氏名: ${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}</p>
                <p>メールアドレス: ${user.email}</p>
                <p>ステータス: <span class="status-badge ${isWithdrawn ? 'status-withdrawn' : 'status-active'}">
                    ${isWithdrawn ? '退会済み' : 'アクティブ'}
                </span></p>
            </div>

            <div class="user-detail-section">
                <h3><i class="fas fa-calendar"></i> 登録情報</h3>
                <p>登録日時: ${formatDateTime(user.created_at)}</p>
                ${isWithdrawn ? `<p>退会日時: ${formatDateTime(user.user_metadata?.deleted_at)}</p>` : ''}
            </div>

            <div class="user-detail-section">
                <h3><i class="fas fa-shopping-bag"></i> 購入履歴</h3>
                <p>注文数: ${user.order_count || 0}件</p>
            </div>
        </div>
    `;

    showAlertModal(detailHtml, 'info', true);
};

/**
 * ユーザーの注文履歴を表示
 */
window.viewUserOrders = async function(userId) {
    try {
        console.log('📥 ユーザーの注文履歴を取得中...', userId);

        // 全注文を取得してフィルタ
        const allOrders = await fetchAllOrders();
        const userOrders = allOrders.filter(order => order.user_id === userId);

        if (userOrders.length === 0) {
            showAlertModal('このユーザーの注文履歴はありません', 'info');
            return;
        }

        // 注文履歴を作成日時の降順でソート
        const sortedOrders = userOrders.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        const ordersHtml = sortedOrders.map(order => `
            <div class="order-history-item">
                <div class="order-history-header">
                    <span class="order-number">${order.order_number}</span>
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-history-body">
                    <p>注文日: ${formatDate(order.created_at)}</p>
                    <p>合計金額: ¥${order.total.toLocaleString()}</p>
                    <p>商品数: ${order.order_items ? order.order_items.length : 0}点</p>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="user-orders-container">
                <h2>注文履歴 (${userOrders.length}件)</h2>
                <div class="orders-history-list">
                    ${ordersHtml}
                </div>
            </div>
        `;

        showAlertModal(html, 'info', true);
    } catch (error) {
        console.error('注文履歴取得エラー:', error);
        showAlertModal('注文履歴の取得に失敗しました', 'error');
    }
};

/**
 * ユーザーを検索
 */
function searchUsers() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';

    filteredUsers = allUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        `${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}`.toLowerCase().includes(searchTerm)
    );

    renderUsers();
    updateStatistics();
}

/**
 * ユーザーをフィルタ
 */
function filterUsers() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    if (statusFilter === 'all') {
        filteredUsers = [...allUsers];
    } else if (statusFilter === 'active') {
        filteredUsers = allUsers.filter(user =>
            !user.user_metadata || user.user_metadata.status !== 'withdrawn'
        );
    } else if (statusFilter === 'withdrawn') {
        filteredUsers = allUsers.filter(user =>
            user.user_metadata && user.user_metadata.status === 'withdrawn'
        );
    }

    renderUsers();
    updateStatistics();
}

/**
 * 統計情報を更新
 */
function updateStatistics() {
    const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => !u.user_metadata || u.user_metadata.status !== 'withdrawn').length,
        withdrawn: allUsers.filter(u => u.user_metadata && u.user_metadata.status === 'withdrawn').length,
        filtered: filteredUsers.length
    };

    document.getElementById('totalUsers')?.textContent = stats.total;
    document.getElementById('activeUsers')?.textContent = stats.active;
    document.getElementById('withdrawnUsers')?.textContent = stats.withdrawn;
    document.getElementById('filteredCount')?.textContent = stats.filtered;
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
 * 日付フォーマット
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
