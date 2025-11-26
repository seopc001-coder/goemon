// 五右衛門 ECサイト - ユーザー管理 JavaScript

let allUsers = [];
let filteredUsers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeUserManagement();
});

async function initializeUserManagement() {
    // 管理者権限チェック
    await checkAdminAccess();

    // ユーザーデータを読み込み
    await loadUsers();

    // 統計を更新
    updateStatistics();
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

// ユーザーデータを読み込み
async function loadUsers() {
    try {
        // RPC関数を使用して全ユーザーを取得（注文数込み）
        const users = await fetchAllUsers();

        // ユーザーデータをアプリ用フォーマットに変換
        allUsers = users.map((user) => {
            const metadata = user.user_metadata || {};

            return {
                userId: user.id,
                email: user.email,
                name: `${metadata.lastName || ''} ${metadata.firstName || ''}`.trim() || 'ゲスト',
                status: metadata.status === 'withdrawn' ? 'withdrawn' : 'active',
                registeredAt: user.created_at,
                withdrawnAt: metadata.deleted_at || null,
                orderCount: user.order_count || 0  // RPC関数から取得した注文数を使用
            };
        });

        // 登録日でソート（新しい順）
        allUsers.sort((a, b) => {
            return new Date(b.registeredAt) - new Date(a.registeredAt);
        });

        filteredUsers = [...allUsers];
        renderUsers(filteredUsers);
        console.log('Loaded users from Supabase (RPC):', allUsers.length);
    } catch (error) {
        console.error('Error loading users from Supabase:', error);
        showAlertModal('ユーザーデータの読み込みに失敗しました', 'error');
        // エラー時はlocalStorageから読み込み（フォールバック）
        loadUsersFromLocalStorage();
    }
}

// localStorageからユーザーを読み込み（フォールバック）
function loadUsersFromLocalStorage() {
    try {
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];
        const withdrawnUsers = JSON.parse(localStorage.getItem('goemonwithdrawnusers')) || [];

        // 注文から一意のユーザーを抽出
        const userMap = new Map();

        orders.forEach(order => {
            const email = order.customerEmail;
            const name = order.customerName;

            if (email && !userMap.has(email)) {
                userMap.set(email, {
                    userId: generateUserId(email),
                    email: email,
                    name: name || 'ゲスト',
                    status: 'active',
                    registeredAt: order.orderDate,
                    orderCount: 0
                });
            }

            if (email && userMap.has(email)) {
                userMap.get(email).orderCount++;
            }
        });

        // 退会ユーザーを追加
        withdrawnUsers.forEach(withdrawnUser => {
            const email = withdrawnUser.email;
            const userOrders = orders.filter(o => o.customerEmail === email);

            userMap.set(email, {
                userId: withdrawnUser.userId || generateUserId(email),
                email: email,
                name: 'ゲスト',
                status: 'withdrawn',
                registeredAt: withdrawnUser.deleted_at,
                withdrawnAt: withdrawnUser.deleted_at,
                orderCount: userOrders.length
            });
        });

        allUsers = Array.from(userMap.values());

        // 登録日でソート（新しい順）
        allUsers.sort((a, b) => {
            return new Date(b.registeredAt) - new Date(a.registeredAt);
        });

        filteredUsers = [...allUsers];
        renderUsers(filteredUsers);
        console.log('Loaded users from localStorage (fallback):', allUsers.length);
    } catch (error) {
        console.error('Error loading users from localStorage:', error);
        showAlertModal('ユーザーデータの読み込みに失敗しました', 'error');
    }
}

// ユーザーIDを生成（デモ用）
function generateUserId(email) {
    // メールアドレスから簡易的なIDを生成
    return 'user_' + email.split('@')[0].substring(0, 8) + Math.floor(Math.random() * 1000);
}

// 統計を更新
function updateStatistics() {
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const withdrawnUsers = allUsers.filter(u => u.status === 'withdrawn').length;

    // 今月の新規登録
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = allUsers.filter(u => {
        const registeredDate = new Date(u.registeredAt);
        return registeredDate >= thisMonthStart && u.status !== 'withdrawn';
    }).length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('withdrawnUsers').textContent = withdrawnUsers;
    document.getElementById('newUsersThisMonth').textContent = newUsersThisMonth;
}

// ユーザーを表示
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <h3 style="margin-bottom: 10px;">条件に一致するユーザーがいません</h3>
                    <p>フィルター条件を変更してください</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const registeredDate = new Date(user.registeredAt);
        const statusClass = user.status === 'active' ? 'active' : user.status === 'withdrawn' ? 'withdrawn' : 'inactive';
        const statusText = user.status === 'active' ? 'アクティブ' : user.status === 'withdrawn' ? '退会済み' : '非アクティブ';

        return `
            <tr>
                <td><span style="font-family: monospace; color: #666;">${user.userId.substring(0, 12)}...</span></td>
                <td>${user.email}</td>
                <td>${user.name || 'ゲスト'}</td>
                <td>${formatDate(registeredDate)}</td>
                <td><strong>${user.orderCount}</strong> 件</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="viewUserDetail('${user.email}')">
                            <i class="fas fa-eye"></i> 詳細
                        </button>
                        <button class="btn-small btn-danger" onclick="deleteUser('${user.id}', '${user.email}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 日付をフォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
}

// フィルターを適用
function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const searchKeyword = document.getElementById('filterSearch').value.trim().toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    filteredUsers = allUsers.filter(user => {
        // ステータスフィルター
        if (status && user.status !== status) {
            return false;
        }

        // 検索キーワード
        if (searchKeyword) {
            const email = user.email.toLowerCase();
            const name = (user.name || '').toLowerCase();

            if (!email.includes(searchKeyword) && !name.includes(searchKeyword)) {
                return false;
            }
        }

        // 日付フィルター（開始）
        if (dateFrom) {
            const registeredDate = new Date(user.registeredAt);
            const fromDate = new Date(dateFrom);
            if (registeredDate < fromDate) {
                return false;
            }
        }

        // 日付フィルター（終了）
        if (dateTo) {
            const registeredDate = new Date(user.registeredAt);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (registeredDate > toDate) {
                return false;
            }
        }

        return true;
    });

    renderUsers(filteredUsers);
}

// フィルターをリセット
function resetFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filteredUsers = [...allUsers];
    renderUsers(filteredUsers);
}

// ユーザー詳細を表示
function viewUserDetail(email) {
    const user = allUsers.find(u => u.email === email);

    if (!user) {
        showAlertModal('ユーザーが見つかりません', 'error');
        return;
    }

    // 注文履歴を取得
    const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];
    const userOrders = orders.filter(order => order.customerEmail === email);

    // 総購入金額を計算
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // 最終注文日
    const lastOrderDate = userOrders.length > 0 ?
        new Date(userOrders[userOrders.length - 1].orderDate).toLocaleDateString('ja-JP') :
        'なし';

    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('userDetailBody');

    modalTitle.innerHTML = `
        <i class="fas fa-user"></i> ユーザー詳細 - ${user.name}
    `;

    const statusClass = user.status === 'active' ? 'active' : user.status === 'withdrawn' ? 'withdrawn' : 'inactive';
    const statusText = user.status === 'active' ? 'アクティブ' : user.status === 'withdrawn' ? '退会済み' : '非アクティブ';

    modalBody.innerHTML = `
        <!-- 基本情報 -->
        <div class="detail-section">
            <h3><i class="fas fa-info-circle"></i> 基本情報</h3>
            <div class="detail-grid">
                <div class="detail-label">ユーザーID:</div>
                <div><code>${user.userId}</code></div>

                <div class="detail-label">メールアドレス:</div>
                <div>${user.email}</div>

                <div class="detail-label">氏名:</div>
                <div>${user.name || 'ゲスト'}</div>

                <div class="detail-label">登録日:</div>
                <div>${formatDate(new Date(user.registeredAt))}</div>

                <div class="detail-label">ステータス:</div>
                <div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>

                ${user.withdrawnAt ? `
                    <div class="detail-label">退会日:</div>
                    <div>${formatDate(new Date(user.withdrawnAt))}</div>
                ` : ''}
            </div>
        </div>

        <!-- 購入統計 -->
        <div class="detail-section">
            <h3><i class="fas fa-chart-bar"></i> 購入統計</h3>
            <div class="detail-grid">
                <div class="detail-label">総注文数:</div>
                <div><strong>${user.orderCount}</strong> 件</div>

                <div class="detail-label">総購入金額:</div>
                <div><strong style="color: #f44336;">¥${totalSpent.toLocaleString()}</strong></div>

                <div class="detail-label">最終注文日:</div>
                <div>${lastOrderDate}</div>

                <div class="detail-label">平均購入額:</div>
                <div>¥${userOrders.length > 0 ? Math.floor(totalSpent / userOrders.length).toLocaleString() : '0'}</div>
            </div>
        </div>

        <!-- 最近の注文 -->
        <div class="detail-section">
            <h3><i class="fas fa-history"></i> 最近の注文</h3>
            ${userOrders.length > 0 ? `
                <div style="border: 1px solid #eee; border-radius: 4px;">
                    ${userOrders.slice(-5).reverse().map(order => `
                        <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div><strong>#${order.orderId}</strong></div>
                                <div style="color: #666; font-size: 14px; margin-top: 5px;">
                                    ${formatDate(new Date(order.orderDate))} - ${order.items?.length || 0}点
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #f44336;">¥${(order.totalAmount || 0).toLocaleString()}</div>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">${order.status}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <p style="color: #999; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 4px;">
                    注文履歴がありません
                </p>
            `}
        </div>
    `;

    modal.classList.add('active');
}

// ユーザーモーダルを閉じる
function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.classList.remove('active');
}

// ユーザーを削除
async function deleteUser(userId, userEmail) {
    // 確認ダイアログ
    if (!confirm(`ユーザー「${userEmail}」を完全に削除しますか?\n\nこの操作は取り消せません。\n- ユーザープロファイル\n- カートデータ\n- お気に入り\n- 配送先住所\nすべてのデータが削除されます。`)) {
        return;
    }

    try {
        console.log('ユーザー削除開始:', userId, userEmail);

        // 1. カートデータを削除
        const { error: cartError } = await supabase
            .from('carts')
            .delete()
            .eq('user_id', userId);

        if (cartError) {
            console.error('カート削除エラー:', cartError);
        }

        // 2. お気に入りを削除
        const { error: favError } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId);

        if (favError) {
            console.error('お気に入り削除エラー:', favError);
        }

        // 3. 配送先住所を削除
        const { error: addressError } = await supabase
            .from('shipping_addresses')
            .delete()
            .eq('user_id', userId);

        if (addressError) {
            console.error('配送先住所削除エラー:', addressError);
        }

        // 4. ユーザープロファイルを削除
        const { error: profileError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('プロファイル削除エラー:', profileError);
            throw profileError;
        }

        // 5. Auth ユーザーを削除（管理者権限が必要）
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth削除エラー:', authError);
            showAlertModal('ユーザーの認証情報の削除に失敗しました。\nデータベースからは削除されましたが、認証ユーザーは残っています。', 'warning');
        }

        showAlertModal('ユーザーを削除しました', 'success');

        // ユーザーリストを再読み込み
        await loadUsers();

    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        showAlertModal('ユーザーの削除に失敗しました: ' + error.message, 'error');
    }
}

// モーダル外クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('userModal');

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeUserModal();
            }
        });
    }
});
