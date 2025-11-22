// 五右衛門 ECサイト - 退会ユーザー管理 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPage();
});

function initializeAdminPage() {
    // 管理者権限チェック（実装例）
    checkAdminAccess();

    // 検索フォームの初期化
    initializeSearchForm();
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

// 検索フォームの初期化
function initializeSearchForm() {
    const form = document.getElementById('searchForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('searchEmail').value.trim();

        if (!email) {
            showAlertModal('メールアドレスを入力してください', 'warning');
            return;
        }

        await searchWithdrawnUser(email);
    });
}

// 退会ユーザーを検索
async function searchWithdrawnUser(email) {
    const searchResults = document.getElementById('searchResults');

    try {
        // ローディング表示
        searchResults.style.display = 'block';
        searchResults.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <i class="fas fa-spinner fa-spin fa-3x" style="color: #666; margin-bottom: 20px;"></i>
                <p style="color: #666;">検索中...</p>
            </div>
        `;

        // Supabase Admin APIを使用してユーザーを検索
        const user = await searchWithdrawnUserByEmail(email);

        if (user) {
            // ユーザーが見つかった場合
            displayUserInfo(user);
        } else {
            // ユーザーが見つからない場合
            searchResults.innerHTML = `
                <div style="background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <i class="fas fa-user-slash fa-3x" style="color: #999; margin-bottom: 20px;"></i>
                    <h3 style="color: #666; margin-bottom: 10px;">退会ユーザーが見つかりませんでした</h3>
                    <p style="color: #999;">入力されたメールアドレスに一致する退会ユーザーは存在しません</p>
                </div>
            `;
        }

        console.log('Searched withdrawn user from Supabase:', user ? 'Found' : 'Not found');
    } catch (error) {
        console.error('Search error from Supabase:', error);
        showAlertModal('検索中にエラーが発生しました', 'error');
        // エラー時はlocalStorageから検索（フォールバック）
        searchWithdrawnUserFromLocalStorage(email);
    }
}

// localStorageから退会ユーザーを検索（フォールバック）
async function searchWithdrawnUserFromLocalStorage(email) {
    const searchResults = document.getElementById('searchResults');

    try {
        const withdrawnUsers = JSON.parse(localStorage.getItem('goemonwithdrawnusers')) || [];
        const user = withdrawnUsers.find(u => u.email === email);

        if (user) {
            displayUserInfo(user);
            console.log('Searched withdrawn user from localStorage (fallback): Found');
        } else {
            searchResults.innerHTML = `
                <div style="background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <i class="fas fa-user-slash fa-3x" style="color: #999; margin-bottom: 20px;"></i>
                    <h3 style="color: #666; margin-bottom: 10px;">退会ユーザーが見つかりませんでした</h3>
                    <p style="color: #999;">入力されたメールアドレスに一致する退会ユーザーは存在しません</p>
                </div>
            `;
            console.log('Searched withdrawn user from localStorage (fallback): Not found');
        }
    } catch (error) {
        console.error('Search error from localStorage:', error);
        showAlertModal('検索中にエラーが発生しました', 'error');
        searchResults.style.display = 'none';
    }
}

// ユーザー情報を表示
async function displayUserInfo(user) {
    const searchResults = document.getElementById('searchResults');

    try {
        // Supabaseから注文履歴を取得
        let userOrders = [];
        try {
            const dbOrders = await fetchOrdersByUserId(user.id);
            userOrders = dbOrders;
        } catch (error) {
            console.error('Error fetching orders from Supabase:', error);
            // フォールバック: localStorageから取得
            const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];
            userOrders = orders.filter(order => order.customerEmail === user.email);
        }

        // ユーザーメタデータから退会情報を取得
        const metadata = user.user_metadata || {};
        const withdrawalDate = metadata.deleted_at ? new Date(metadata.deleted_at).toLocaleDateString('ja-JP') : '不明';
        const lastOrderDate = userOrders.length > 0 ?
            new Date(userOrders[userOrders.length - 1].created_at || userOrders[userOrders.length - 1].orderDate).toLocaleDateString('ja-JP') :
            '注文なし';

    searchResults.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                <div>
                    <h2 style="font-size: 24px; margin-bottom: 10px;">
                        <i class="fas fa-user-times" style="color: #f44336;"></i> 退会ユーザー情報
                    </h2>
                    <span style="background: #f44336; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500;">退会済み</span>
                </div>
            </div>

            <!-- 基本情報 -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; margin-bottom: 15px; color: #333;">
                    <i class="fas fa-info-circle"></i> 基本情報
                </h3>
                <div style="display: grid; grid-template-columns: 200px 1fr; gap: 15px;">
                    <div style="color: #666; font-weight: 500;">ユーザーID:</div>
                    <div>${user.id || user.userId || 'N/A'}</div>

                    <div style="color: #666; font-weight: 500;">メールアドレス:</div>
                    <div>${user.email}</div>

                    <div style="color: #666; font-weight: 500;">退会日時:</div>
                    <div>${withdrawalDate}</div>

                    <div style="color: #666; font-weight: 500;">最終注文日:</div>
                    <div>${lastOrderDate}</div>

                    <div style="color: #666; font-weight: 500;">総注文数:</div>
                    <div>${userOrders.length}件</div>
                </div>
            </div>

            <!-- 退会理由 -->
            ${metadata.deletion_reason || user.deletion_reason ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 18px; margin-bottom: 15px; color: #333;">
                        <i class="fas fa-comment"></i> 退会理由
                    </h3>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                        ${metadata.deletion_reason || user.deletion_reason}
                    </div>
                </div>
            ` : ''}

            <!-- 注文履歴 -->
            <div>
                <h3 style="font-size: 18px; margin-bottom: 15px; color: #333;">
                    <i class="fas fa-shopping-bag"></i> 注文履歴（${userOrders.length}件）
                </h3>
                ${userOrders.length > 0 ? `
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${userOrders.map(order => {
                            const orderDate = order.created_at || order.orderDate;
                            const orderNumber = order.order_number || order.orderId;
                            const orderStatus = order.status;
                            const orderTotal = order.total || order.totalAmount;
                            const orderItems = order.order_items || order.items;
                            return `
                            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <strong>注文番号: ${orderNumber}</strong>
                                    <span style="background: ${getStatusColor(orderStatus)}; color: white; padding: 2px 10px; border-radius: 4px; font-size: 12px;">
                                        ${orderStatus}
                                    </span>
                                </div>
                                <div style="color: #666; font-size: 14px;">
                                    <p style="margin: 5px 0;">注文日: ${new Date(orderDate).toLocaleDateString('ja-JP')}</p>
                                    <p style="margin: 5px 0;">金額: ¥${orderTotal?.toLocaleString()}</p>
                                    <p style="margin: 5px 0;">商品数: ${orderItems?.length || 0}点</p>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                ` : `
                    <p style="color: #999; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                        注文履歴がありません
                    </p>
                `}
            </div>
        </div>

        <!-- アクション -->
        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="font-size: 18px; margin-bottom: 15px; color: #333;">
                <i class="fas fa-tools"></i> 管理アクション
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <button class="btn-cmn-01" onclick="exportUserData('${user.email}')">
                    <i class="fas fa-download"></i> データをエクスポート
                </button>
                <button class="btn-cmn-01" onclick="viewFullOrderHistory('${user.email}')">
                    <i class="fas fa-history"></i> 注文履歴詳細
                </button>
                <button class="btn-cmn-01" onclick="printUserInfo()">
                    <i class="fas fa-print"></i> 印刷
                </button>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('Error displaying user info:', error);
        searchResults.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #f44336; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">ユーザー情報の表示中にエラーが発生しました</h3>
                <p style="color: #999;">もう一度お試しください</p>
            </div>
        `;
    }
}

// ステータスに応じた色を返す
function getStatusColor(status) {
    const colors = {
        '準備中': '#ff9800',
        '配送中': '#2196F3',
        '配送完了': '#4CAF50',
        'キャンセル': '#f44336'
    };
    return colors[status] || '#999';
}

// データをエクスポート
function exportUserData(email) {
    showAlertModal('データエクスポート機能は実装予定です', 'info');
    console.log('Export data for:', email);
}

// 注文履歴詳細を表示
function viewFullOrderHistory(email) {
    showAlertModal('注文履歴詳細表示機能は実装予定です', 'info');
    console.log('View full order history for:', email);
}

// ユーザー情報を印刷
function printUserInfo() {
    window.print();
}
