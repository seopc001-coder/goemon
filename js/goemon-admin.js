// 五右衛門 ECサイト - 管理画面 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    // 管理者権限チェック
    await checkAdminAccess();

    // 統計データを読み込み
    loadStatistics();

    // 最近の注文を表示
    loadRecentOrders();
}

// 管理者権限チェック
async function checkAdminAccess() {
    // 管理者認証チェック
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated');

    if (adminAuthenticated !== 'true') {
        // 管理者認証されていない場合は管理者ログインページへ
        window.location.href = 'goemon-admin-login.html';
        return;
    }

    // 管理者IDを表示
    const adminNameElem = document.getElementById('adminName');
    const adminId = sessionStorage.getItem('adminId');
    if (adminNameElem && adminId) {
        adminNameElem.textContent = adminId;
    }

    console.log('Admin access granted for:', adminId);
}

// 統計データを読み込み
function loadStatistics() {
    try {
        // 注文データを取得
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];

        // 今日の日付を取得
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 昨日の日付を取得
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // 本日の注文
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });

        // 昨日の注文
        const yesterdayOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === yesterday.getTime();
        });

        // 本日の売上
        const todaySales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // 変化率を計算
        const ordersChange = calculateChange(todayOrders.length, yesterdayOrders.length);
        const salesChange = calculateChange(todaySales, yesterdaySales);

        // 統計を表示
        updateStatCard('todayOrders', todayOrders.length, ordersChange, 'todayOrdersChange');
        updateStatCard('todaySales', `¥${todaySales.toLocaleString()}`, salesChange, 'todaySalesChange');

        // ユーザー統計（デモデータ）
        // 実際の実装ではSupabaseのユーザー数を取得
        const totalUsers = calculateTotalUsers();
        const usersChange = { value: 5, isPositive: true };
        updateStatCard('totalUsers', totalUsers, usersChange, 'totalUsersChange');

        // 在庫アラート（デモデータ）
        const lowStockCount = calculateLowStockCount();
        document.getElementById('lowStockCount').textContent = lowStockCount;

        const lowStockChangeElem = document.getElementById('lowStockChange');
        if (lowStockCount > 0) {
            lowStockChangeElem.textContent = '早急な補充が必要です';
            lowStockChangeElem.style.color = '#f44336';
        } else {
            lowStockChangeElem.textContent = '在庫は適正です';
            lowStockChangeElem.style.color = '#4CAF50';
        }

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// 統計カードを更新
function updateStatCard(valueId, value, change, changeId) {
    const valueElem = document.getElementById(valueId);
    const changeElem = document.getElementById(changeId);

    if (valueElem) {
        valueElem.textContent = value;
    }

    if (changeElem && change) {
        const icon = change.isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const className = change.isPositive ? 'positive' : 'negative';

        changeElem.className = `stat-change ${className}`;
        changeElem.innerHTML = `<i class="fas ${icon}"></i> ${change.isPositive ? '+' : ''}${change.value}%`;
    }
}

// 変化率を計算
function calculateChange(current, previous) {
    if (previous === 0) {
        return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    }

    const changePercent = ((current - previous) / previous * 100).toFixed(1);
    return {
        value: Math.abs(changePercent),
        isPositive: changePercent >= 0
    };
}

// 総ユーザー数を計算（デモ実装）
function calculateTotalUsers() {
    // 実際の実装ではSupabase Admin APIを使用
    // const { data: { users }, error } = await supabase.auth.admin.listUsers();

    // デモ: localStorageからの推定
    const withdrawnUsers = JSON.parse(localStorage.getItem('goemonwithdrawnusers')) || [];
    const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];

    // 注文履歴から一意のメールアドレス数を取得
    const uniqueEmails = new Set(orders.map(order => order.customerEmail));

    return uniqueEmails.size + withdrawnUsers.length;
}

// 在庫アラート数を計算
function calculateLowStockCount() {
    try {
        // localStorageから商品データを取得（商品管理ページと同じデータ）
        let products = localStorage.getItem('goemonproducts');

        // データがない場合は生成して保存
        if (!products) {
            if (!window.GOEMON_PRODUCTS || typeof window.GOEMON_PRODUCTS.generateProductsData !== 'function') {
                return 0;
            }

            const generatedProducts = window.GOEMON_PRODUCTS.generateProductsData(100);

            // 各商品に在庫数を設定
            Object.keys(generatedProducts).forEach(key => {
                const product = generatedProducts[key];
                if (!product.hasOwnProperty('stock')) {
                    product.stock = Math.floor(Math.random() * 100);
                }
            });

            localStorage.setItem('goemonproducts', JSON.stringify(generatedProducts));
            products = generatedProducts;
        } else {
            products = JSON.parse(products);
        }

        let lowStockCount = 0;

        // 在庫が10未満の商品をカウント
        Object.keys(products).forEach(key => {
            const product = products[key];
            if (product.stock < 10) {
                lowStockCount++;
            }
        });

        return lowStockCount;
    } catch (error) {
        console.error('Error calculating low stock count:', error);
        return 0;
    }
}

// 最近の注文を表示
function loadRecentOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];

        // 注文を日付順にソート（新しい順）
        const sortedOrders = orders.sort((a, b) => {
            return new Date(b.orderDate) - new Date(a.orderDate);
        });

        // 最新10件を取得
        const recentOrders = sortedOrders.slice(0, 10);

        const tbody = document.getElementById('recentOrdersBody');

        if (recentOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                        注文がまだありません
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const orderDate = new Date(order.orderDate);

            return `
                <tr>
                    <td><strong>#${order.orderId}</strong></td>
                    <td>${order.customerName || 'ゲスト'}</td>
                    <td>${formatDateTime(orderDate)}</td>
                    <td><strong>¥${(order.totalAmount || 0).toLocaleString()}</strong></td>
                    <td>
                        <span class="status-badge ${statusInfo.class}">${order.status}</span>
                    </td>
                    <td>
                        <button class="btn-cmn-01" style="padding: 6px 15px; font-size: 14px;" onclick="viewOrderDetail('${order.orderId}')">
                            <i class="fas fa-eye"></i> 詳細
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// ステータス情報を取得
function getStatusInfo(status) {
    const statusMap = {
        '準備中': { class: 'pending', icon: 'fa-clock' },
        '配送中': { class: 'shipping', icon: 'fa-truck' },
        '配送完了': { class: 'completed', icon: 'fa-check-circle' },
        'キャンセル': { class: 'cancelled', icon: 'fa-times-circle' }
    };

    return statusMap[status] || { class: 'pending', icon: 'fa-question-circle' };
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

// 注文詳細を表示
function viewOrderDetail(orderId) {
    // 注文管理ページへ遷移（実装予定）
    showAlertModal(`注文 #${orderId} の詳細表示機能は実装中です`, 'info');
    console.log('View order detail:', orderId);
}

// 在庫アラート商品を表示
function viewLowStockProducts() {
    // 商品管理ページへ遷移し、在庫少フィルターを適用
    window.location.href = 'goemon-admin-products.html?filter=lowstock';
}

// 管理者ログアウト
function adminLogout() {
    showConfirmModal('ログアウトしますか？', () => {
        // セッション情報をクリア
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminId');
        sessionStorage.removeItem('adminLoginTime');

        showAlertModal('ログアウトしました', 'success');

        setTimeout(() => {
            window.location.href = 'goemon-admin-login.html';
        }, 1500);
    });
}
