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
async function loadStatistics() {
    try {
        // Supabaseから注文データを取得
        const orders = await fetchAllOrders();

        // 今日の日付を取得
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 昨日の日付を取得
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // 本日の注文
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });

        // 昨日の注文
        const yesterdayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === yesterday.getTime();
        });

        // 本日の売上
        const todaySales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        // 変化率を計算
        const ordersChange = calculateChange(todayOrders.length, yesterdayOrders.length);
        const salesChange = calculateChange(todaySales, yesterdaySales);

        // 統計を表示
        updateStatCard('todayOrders', todayOrders.length, ordersChange, 'todayOrdersChange');
        updateStatCard('todaySales', `¥${todaySales.toLocaleString()}`, salesChange, 'todaySalesChange');

        // 当月の売上を計算
        const { monthlySales, lastMonthSales } = calculateMonthlySales(orders);
        const monthlySalesChange = calculateChange(monthlySales, lastMonthSales);
        updateStatCard('monthlySales', `¥${monthlySales.toLocaleString()}`, monthlySalesChange, 'monthlySalesChange');

        // 在庫アラート（Supabaseから取得）
        const lowStockCount = await calculateLowStockCount();
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

// 当月の売上を計算
function calculateMonthlySales(orders) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // 先月の年月を計算
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // 当月の売上
    const monthlySales = orders.filter(order => {
        const orderDate = new Date(order.orderDate || order.created_at);
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
    }).reduce((sum, order) => sum + (order.totalAmount || order.total_amount || 0), 0);

    // 先月の売上
    const lastMonthSales = orders.filter(order => {
        const orderDate = new Date(order.orderDate || order.created_at);
        return orderDate.getFullYear() === lastMonthYear && orderDate.getMonth() === lastMonth;
    }).reduce((sum, order) => sum + (order.totalAmount || order.total_amount || 0), 0);

    return { monthlySales, lastMonthSales };
}

// 在庫アラート数を計算（バリエーション対応 - 色ごとにカウント）
async function calculateLowStockCount() {
    try {
        // Supabaseから商品データを取得
        const products = await fetchAllProducts();

        if (!products || products.length === 0) {
            return 0;
        }

        let lowStockCount = 0;

        products.forEach(product => {
            // 在庫アラート確認済み商品は除外
            if (product.low_stock_confirmed) {
                return;
            }

            // バリエーションがある場合
            if (product.variants && product.variants.stock) {
                const variantStock = product.variants.stock;

                // いずれかのバリエーションの在庫が10未満ならカウント
                for (const stock of Object.values(variantStock)) {
                    if (stock < 10) {
                        lowStockCount++;
                        break; // 1つでも在庫が少なければカウント（重複を避ける）
                    }
                }
            } else {
                // バリエーションがない場合は基本在庫をチェック
                if (product.stock < 10) {
                    lowStockCount++;
                }
            }
        });

        return lowStockCount;
    } catch (error) {
        console.error('Error calculating low stock count:', error);
        return 0;
    }
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

// 最近の注文を表示
async function loadRecentOrders() {
    try {
        // Supabaseから注文データを取得
        const orders = await fetchAllOrders();

        // 最新10件を取得（すでにcreated_atでソート済み）
        const recentOrders = orders.slice(0, 10);

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
            // ステータスを日本語に変換
            const normalizedOrder = normalizeOrderStatus(order);
            const statusInfo = getStatusInfo(normalizedOrder.status);
            const orderDate = new Date(order.created_at);

            // 顧客名を取得（shipping_family_name + shipping_given_nameから構築）
            const customerName = order.shipping_family_name && order.shipping_given_name
                ? `${order.shipping_family_name} ${order.shipping_given_name}`
                : order.shipping_family_name || order.shipping_given_name || '未設定';

            // 合計金額を計算
            const totalAmount = order.total || 0;

            return `
                <tr>
                    <td><strong>#${order.order_number || order.id.substring(0, 8)}</strong></td>
                    <td>${customerName}</td>
                    <td>${formatDateTime(orderDate)}</td>
                    <td><strong>¥${totalAmount.toLocaleString()}</strong></td>
                    <td>
                        <span class="status-badge ${statusInfo.class}">${order.status}</span>
                    </td>
                    <td>
                        <button class="btn-cmn-01" style="padding: 6px 15px; font-size: 14px;" onclick="viewOrderDetail('${order.id}')">
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

// 注文詳細を表示
function viewOrderDetail(orderId) {
    // 注文IDをセッションストレージに保存して注文管理ページへ遷移
    sessionStorage.setItem('viewOrderId', orderId);
    window.location.href = 'goemon-admin-orders.html';
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
