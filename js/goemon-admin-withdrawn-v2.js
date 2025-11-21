// ===================================
// 五右衛門 ECサイト - 退会ユーザー管理 (Supabase版)
// ===================================

console.log('goemon-admin-withdrawn-v2.js loaded');

let withdrawnUsers = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Withdrawn Users Management');
    initializeWithdrawnUsers();
});

async function initializeWithdrawnUsers() {
    // 管理者権限チェック
    await checkAdminAccess();

    // Supabaseから退会ユーザーを読み込み
    await loadWithdrawnUsers();

    // イベントリスナー設定
    document.getElementById('searchWithdrawnBtn')?.addEventListener('click', searchWithdrawnUser);
    document.getElementById('withdrawnSearch')?.addEventListener('input', filterWithdrawnUsers);

    console.log('Withdrawn users management initialized');
}

/**
 * 退会ユーザーをSupabaseから読み込み
 */
async function loadWithdrawnUsers() {
    try {
        console.log('📥 Supabaseから退会ユーザーを取得中...');
        withdrawnUsers = await fetchWithdrawnUsers();
        console.log('✅ 退会ユーザー取得完了:', withdrawnUsers.length, '件');
        renderWithdrawnUsers();
        updateStatistics();
    } catch (error) {
        console.error('退会ユーザー読み込みエラー:', error);
        showAlertModal('退会ユーザーデータの読み込みに失敗しました', 'error');
    }
}

/**
 * 退会ユーザーを表示
 */
function renderWithdrawnUsers() {
    const list = document.getElementById('withdrawnUsersList');
    if (!list) return;

    if (withdrawnUsers.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-times"></i>
                <h3>退会ユーザーがいません</h3>
                <p>退会したユーザーがここに表示されます</p>
            </div>
        `;
        return;
    }

    // 退会日時の降順でソート
    const sortedUsers = [...withdrawnUsers].sort((a, b) => {
        const dateA = a.user_metadata?.deleted_at ? new Date(a.user_metadata.deleted_at) : new Date(0);
        const dateB = b.user_metadata?.deleted_at ? new Date(b.user_metadata.deleted_at) : new Date(0);
        return dateB - dateA;
    });

    list.innerHTML = sortedUsers.map(user => `
        <div class="withdrawn-user-item" data-id="${user.id}">
            <div class="withdrawn-user-header">
                <div class="withdrawn-user-info-main">
                    <div class="withdrawn-user-name">
                        ${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}
                    </div>
                    <div class="withdrawn-user-email">${user.email}</div>
                </div>
                <span class="withdrawn-badge">退会済み</span>
            </div>
            <div class="withdrawn-user-body">
                <div class="withdrawn-user-meta">
                    <p><i class="fas fa-calendar-plus"></i> 登録日: ${formatDate(user.created_at)}</p>
                    <p><i class="fas fa-calendar-times"></i> 退会日: ${formatDate(user.user_metadata?.deleted_at)}</p>
                    <p><i class="fas fa-shopping-bag"></i> 注文数: ${user.order_count || 0}件</p>
                </div>
                ${user.user_metadata?.deletion_reason ? `
                    <div class="withdrawal-reason">
                        <strong>退会理由:</strong>
                        <p>${user.user_metadata.deletion_reason}</p>
                    </div>
                ` : ''}
            </div>
            <div class="withdrawn-user-actions">
                <button class="btn-small btn-view" onclick="viewWithdrawnUserDetail('${user.id}')">
                    <i class="fas fa-eye"></i> 詳細
                </button>
                <button class="btn-small btn-orders" onclick="viewWithdrawnUserOrders('${user.id}')">
                    <i class="fas fa-list"></i> 注文履歴
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * 退会ユーザー詳細を表示
 */
window.viewWithdrawnUserDetail = async function(userId) {
    const user = withdrawnUsers.find(u => u.id === userId);
    if (!user) {
        showAlertModal('ユーザーが見つかりません', 'error');
        return;
    }

    const detailHtml = `
        <div class="withdrawn-user-detail-container">
            <h2>退会ユーザー詳細</h2>

            <div class="user-detail-section">
                <h3><i class="fas fa-user"></i> 基本情報</h3>
                <p>氏名: ${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}</p>
                <p>メールアドレス: ${user.email}</p>
            </div>

            <div class="user-detail-section">
                <h3><i class="fas fa-calendar"></i> 日時情報</h3>
                <p>登録日時: ${formatDateTime(user.created_at)}</p>
                <p>退会日時: ${formatDateTime(user.user_metadata?.deleted_at)}</p>
                <p>利用期間: ${calculateDuration(user.created_at, user.user_metadata?.deleted_at)}</p>
            </div>

            <div class="user-detail-section">
                <h3><i class="fas fa-shopping-bag"></i> 購入履歴</h3>
                <p>注文数: ${user.order_count || 0}件</p>
            </div>

            ${user.user_metadata?.deletion_reason ? `
                <div class="user-detail-section">
                    <h3><i class="fas fa-comment"></i> 退会理由</h3>
                    <p>${user.user_metadata.deletion_reason}</p>
                </div>
            ` : ''}
        </div>
    `;

    showAlertModal(detailHtml, 'info', true);
};

/**
 * 退会ユーザーの注文履歴を表示
 */
window.viewWithdrawnUserOrders = async function(userId) {
    try {
        console.log('📥 退会ユーザーの注文履歴を取得中...', userId);

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

        const totalRevenue = userOrders.reduce((sum, order) => sum + order.total, 0);

        const html = `
            <div class="user-orders-container">
                <h2>注文履歴 (${userOrders.length}件)</h2>
                <div class="orders-summary">
                    <p>総購入金額: ¥${totalRevenue.toLocaleString()}</p>
                </div>
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
 * メールアドレスで退会ユーザーを検索
 */
async function searchWithdrawnUser() {
    const email = document.getElementById('emailSearch')?.value.trim();

    if (!email) {
        showAlertModal('メールアドレスを入力してください', 'error');
        return;
    }

    try {
        console.log('🔍 退会ユーザーを検索中...', email);
        const user = await searchWithdrawnUserByEmail(email);

        if (!user) {
            showAlertModal(`「${email}」に一致する退会ユーザーが見つかりませんでした`, 'info');
            return;
        }

        // 検索結果を表示
        viewWithdrawnUserDetail(user.id);
    } catch (error) {
        console.error('退会ユーザー検索エラー:', error);
        showAlertModal('検索に失敗しました: ' + error.message, 'error');
    }
}

/**
 * 退会ユーザーをフィルタ
 */
function filterWithdrawnUsers() {
    const searchTerm = document.getElementById('withdrawnSearch')?.value.toLowerCase() || '';

    const filtered = withdrawnUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        `${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}`.toLowerCase().includes(searchTerm)
    );

    // 一時的にフィルタ結果を表示
    const original = withdrawnUsers;
    withdrawnUsers = filtered;
    renderWithdrawnUsers();
    withdrawnUsers = original;
}

/**
 * 統計情報を更新
 */
function updateStatistics() {
    const stats = {
        total: withdrawnUsers.length,
        thisMonth: countThisMonth(withdrawnUsers),
        thisYear: countThisYear(withdrawnUsers)
    };

    document.getElementById('totalWithdrawn')?.textContent = stats.total;
    document.getElementById('withdrawnThisMonth')?.textContent = stats.thisMonth;
    document.getElementById('withdrawnThisYear')?.textContent = stats.thisYear;
}

/**
 * 今月の退会数をカウント
 */
function countThisMonth(users) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return users.filter(user => {
        if (!user.user_metadata?.deleted_at) return false;
        const date = new Date(user.user_metadata.deleted_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;
}

/**
 * 今年の退会数をカウント
 */
function countThisYear(users) {
    const thisYear = new Date().getFullYear();

    return users.filter(user => {
        if (!user.user_metadata?.deleted_at) return false;
        const date = new Date(user.user_metadata.deleted_at);
        return date.getFullYear() === thisYear;
    }).length;
}

/**
 * 利用期間を計算
 */
function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return '不明';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
        return `${diffDays}日`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `約${months}ヶ月`;
    } else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return `約${years}年${months}ヶ月`;
    }
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
