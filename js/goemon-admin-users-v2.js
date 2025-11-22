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
    // Supabaseからユーザーを読み込み
    await loadUsers();

    // イベントリスナー設定
    document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
    document.getElementById('filterSearch')?.addEventListener('input', applyFilters);
    document.getElementById('filterDateFrom')?.addEventListener('change', applyFilters);
    document.getElementById('filterDateTo')?.addEventListener('change', applyFilters);

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
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>表示するユーザーがいません</p>
                </td>
            </tr>
        `;
        return;
    }

    // 登録日時の降順でソート
    const sortedUsers = [...filteredUsers].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    tbody.innerHTML = sortedUsers.map(user => {
        const status = user.user_metadata?.status || 'active';
        const isWithdrawn = status === 'withdrawn';
        const displayName = `${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}`.trim() || '未設定';

        return `
            <tr>
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.email}</td>
                <td>${displayName}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>${user.order_count || 0}</td>
                <td>
                    <span class="status-badge ${isWithdrawn ? 'inactive' : 'active'}">
                        ${isWithdrawn ? '退会済み' : 'アクティブ'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="viewUserDetail('${user.id}')">
                            <i class="fas fa-eye"></i> 詳細
                        </button>
                    </div>
                </td>
            </tr>
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
    const displayName = `${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}`.trim() || '未設定';

    // 住所情報のHTML生成
    let addressesHtml = '';
    if (user.addresses && user.addresses.length > 0) {
        addressesHtml = user.addresses.map((addr, index) => `
            <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                <div style="font-weight: bold; margin-bottom: 5px;">
                    ${addr.is_default ? '<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-right: 5px;">デフォルト</span>' : ''}
                    住所 ${index + 1}
                </div>
                <div>〒${addr.postal_code || ''}</div>
                <div>${addr.prefecture || ''} ${addr.city || ''} ${addr.address_line1 || ''}</div>
                ${addr.address_line2 ? `<div>${addr.address_line2}</div>` : ''}
                <div>TEL: ${addr.phone_number || '未登録'}</div>
            </div>
        `).join('');
    } else {
        addressesHtml = '<p style="color: #999;">登録された住所がありません</p>';
    }

    const detailHtml = `
        <div class="detail-section">
            <h3><i class="fas fa-user"></i> 基本情報</h3>
            <div class="detail-grid">
                <div class="detail-label">ユーザーID</div>
                <div>${user.id}</div>
                <div class="detail-label">氏名</div>
                <div>${displayName}</div>
                <div class="detail-label">メールアドレス</div>
                <div>${user.email}</div>
                <div class="detail-label">ステータス</div>
                <div>
                    <span class="status-badge ${isWithdrawn ? 'inactive' : 'active'}">
                        ${isWithdrawn ? '退会済み' : 'アクティブ'}
                    </span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3><i class="fas fa-calendar"></i> 登録情報</h3>
            <div class="detail-grid">
                <div class="detail-label">登録日時</div>
                <div>${formatDateTime(user.created_at)}</div>
                ${isWithdrawn ? `
                    <div class="detail-label">退会日時</div>
                    <div>${formatDateTime(user.user_metadata?.deleted_at)}</div>
                ` : ''}
            </div>
        </div>

        <div class="detail-section">
            <h3><i class="fas fa-map-marker-alt"></i> 登録住所</h3>
            ${addressesHtml}
        </div>

        <div class="detail-section">
            <h3><i class="fas fa-shopping-bag"></i> 購入履歴</h3>
            <div class="detail-grid">
                <div class="detail-label">注文数</div>
                <div>${user.order_count || 0}件</div>
            </div>
        </div>
    `;

    // モーダルに表示
    const modal = document.getElementById('userModal');
    const modalBody = document.getElementById('userDetailBody');
    if (modal && modalBody) {
        modalBody.innerHTML = detailHtml;
        modal.classList.add('active');
    }
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
 * フィルターを適用
 */
window.applyFilters = function() {
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const searchTerm = document.getElementById('filterSearch')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';

    filteredUsers = allUsers.filter(user => {
        // ステータスフィルタ
        if (statusFilter === 'active' && user.user_metadata?.status === 'withdrawn') return false;
        if (statusFilter === 'withdrawn' && (!user.user_metadata || user.user_metadata.status !== 'withdrawn')) return false;

        // 検索フィルタ（メールまたは名前）
        if (searchTerm) {
            const email = user.email.toLowerCase();
            const name = `${user.user_metadata?.lastName || ''} ${user.user_metadata?.firstName || ''}`.toLowerCase();
            if (!email.includes(searchTerm) && !name.includes(searchTerm)) return false;
        }

        // 日付フィルタ
        if (dateFrom || dateTo) {
            const createdDate = new Date(user.created_at);
            if (dateFrom && createdDate < new Date(dateFrom)) return false;
            if (dateTo && createdDate > new Date(dateTo + 'T23:59:59')) return false;
        }

        return true;
    });

    renderUsers();
    updateStatistics();
};

/**
 * フィルターをリセット
 */
window.resetFilters = function() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filteredUsers = [...allUsers];
    renderUsers();
    updateStatistics();
};

/**
 * 統計情報を更新
 */
function updateStatistics() {
    // 今月の開始日
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => !u.user_metadata || u.user_metadata.status !== 'withdrawn').length,
        withdrawn: allUsers.filter(u => u.user_metadata && u.user_metadata.status === 'withdrawn').length,
        newThisMonth: allUsers.filter(u => new Date(u.created_at) >= thisMonthStart).length
    };

    document.getElementById('totalUsers').textContent = stats.total;
    document.getElementById('activeUsers').textContent = stats.active;
    document.getElementById('withdrawnUsers').textContent = stats.withdrawn;
    document.getElementById('newUsersThisMonth').textContent = stats.newThisMonth;
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

/**
 * ユーザー詳細モーダルを閉じる
 */
window.closeUserModal = function() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.remove('active');
    }
};
