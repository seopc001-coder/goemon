// 五右衛門 ECサイト - 売上管理 JavaScript

let allOrders = [];
let filteredOrders = [];
let currentTab = 'daily';

document.addEventListener('DOMContentLoaded', function() {
    initializeSalesPage();
});

async function initializeSalesPage() {
    // 管理者権限チェック
    await checkAdminAccess();

    // 注文データを読み込み
    await loadOrders();

    // URLパラメータから期間を設定
    const urlParams = new URLSearchParams(window.location.search);
    const periodParam = urlParams.get('period');
    if (periodParam) {
        document.getElementById('filterPeriod').value = periodParam;
    }

    // 期間選択の変更イベント
    document.getElementById('filterPeriod').addEventListener('change', function() {
        const customGroups = document.querySelectorAll('#customDateGroup, #customDateGroup2');
        if (this.value === 'custom') {
            customGroups.forEach(g => g.style.display = 'block');
        } else {
            customGroups.forEach(g => g.style.display = 'none');
        }
    });

    // 初期表示
    applyFilters();
}

// 管理者権限チェック
async function checkAdminAccess() {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated');

    if (adminAuthenticated !== 'true') {
        window.location.href = 'goemon-admin-login.html';
        return;
    }

    console.log('Admin access granted');
}

// 注文データを読み込み
async function loadOrders() {
    try {
        // Supabaseから注文データを取得
        allOrders = await fetchAllOrders();
        console.log('注文データ読み込み完了:', allOrders.length, '件');
    } catch (error) {
        console.error('注文データ読み込みエラー:', error);
        showAlertModal('注文データの読み込みに失敗しました', 'error');
    }
}

// フィルターを適用
function applyFilters() {
    const period = document.getElementById('filterPeriod').value;
    const keyword = document.getElementById('searchKeyword').value.trim().toLowerCase();

    // 期間でフィルタリング
    const dateRange = getDateRange(period);
    filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at || order.orderDate);

        // 期間チェック
        if (orderDate < dateRange.start || orderDate > dateRange.end) {
            return false;
        }

        // キーワード検索
        if (keyword) {
            const orderNumber = (order.order_number || order.id || '').toLowerCase();
            const customerName = (order.shipping_name || order.customerName || '').toLowerCase();

            if (!orderNumber.includes(keyword) && !customerName.includes(keyword)) {
                return false;
            }
        }

        return true;
    });

    // サマリーを更新
    updateSummary();

    // テーブルを更新
    if (currentTab === 'daily') {
        renderDailySales();
    } else {
        renderMonthlySales();
    }
}

// 期間の取得
function getDateRange(period) {
    const now = new Date();
    let start, end;

    switch (period) {
        case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;

        case 'yesterday':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
            break;

        case 'thisWeek':
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日を週の始まりとする
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;

        case 'lastWeek':
            const lastWeekStart = new Date(now);
            const lastWeekDayOfWeek = lastWeekStart.getDay();
            const lastWeekDiff = lastWeekDayOfWeek === 0 ? -6 : 1 - lastWeekDayOfWeek;
            lastWeekStart.setDate(lastWeekStart.getDate() + lastWeekDiff - 7);
            start = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
            end = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate() + 6, 23, 59, 59);
            break;

        case 'thisMonth':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;

        case 'lastMonth':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            break;

        case 'custom':
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59);
            } else {
                // デフォルトで今月
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }
            break;

        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return { start, end };
}

// サマリーを更新
function updateSummary() {
    const totalSales = filteredOrders.reduce((sum, order) => {
        return sum + (order.total_amount || order.totalAmount || 0);
    }, 0);

    const totalOrders = filteredOrders.length;

    const averageOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    const maxOrder = filteredOrders.reduce((max, order) => {
        const amount = order.total_amount || order.totalAmount || 0;
        return amount > max ? amount : max;
    }, 0);

    const completedOrders = filteredOrders.filter(order => {
        return order.status === '配送完了' || order.status === 'completed';
    }).length;

    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // 表示を更新
    document.getElementById('totalSales').textContent = `¥${totalSales.toLocaleString()}`;
    document.getElementById('totalOrders').textContent = `${totalOrders}件の注文`;
    document.getElementById('averageOrder').textContent = `¥${averageOrder.toLocaleString()}`;
    document.getElementById('maxOrder').textContent = `¥${maxOrder.toLocaleString()}`;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// 日別売上を表示
function renderDailySales() {
    const tbody = document.getElementById('dailySalesBody');

    // 日付ごとにグループ化
    const dailyData = {};

    filteredOrders.forEach(order => {
        const orderDate = new Date(order.created_at || order.orderDate);
        const dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;

        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                date: dateKey,
                orders: [],
                totalSales: 0,
                completedCount: 0
            };
        }

        dailyData[dateKey].orders.push(order);
        dailyData[dateKey].totalSales += (order.total_amount || order.totalAmount || 0);

        if (order.status === '配送完了' || order.status === 'completed') {
            dailyData[dateKey].completedCount++;
        }
    });

    // 日付順にソート（新しい順）
    const sortedDates = Object.keys(dailyData).sort((a, b) => b.localeCompare(a));

    if (sortedDates.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <p>該当する売上データがありません</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = sortedDates.map(dateKey => {
        const data = dailyData[dateKey];
        const orderCount = data.orders.length;
        const averageAmount = Math.round(data.totalSales / orderCount);

        return `
            <tr>
                <td><strong>${formatDate(dateKey)}</strong></td>
                <td>${orderCount}件</td>
                <td class="amount">¥${data.totalSales.toLocaleString()}</td>
                <td>¥${averageAmount.toLocaleString()}</td>
                <td>${data.completedCount}件</td>
            </tr>
        `;
    }).join('');
}

// 月別売上を表示
function renderMonthlySales() {
    const tbody = document.getElementById('monthlySalesBody');

    // 月ごとにグループ化
    const monthlyData = {};

    filteredOrders.forEach(order => {
        const orderDate = new Date(order.created_at || order.orderDate);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                orders: [],
                totalSales: 0,
                completedCount: 0
            };
        }

        monthlyData[monthKey].orders.push(order);
        monthlyData[monthKey].totalSales += (order.total_amount || order.totalAmount || 0);

        if (order.status === '配送完了' || order.status === 'completed') {
            monthlyData[monthKey].completedCount++;
        }
    });

    // 月順にソート（新しい順）
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

    if (sortedMonths.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <p>該当する売上データがありません</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = sortedMonths.map((monthKey, index) => {
        const data = monthlyData[monthKey];
        const orderCount = data.orders.length;
        const averageAmount = Math.round(data.totalSales / orderCount);

        // 前月比を計算
        let changeText = '-';
        if (index < sortedMonths.length - 1) {
            const prevMonthKey = sortedMonths[index + 1];
            const prevMonthData = monthlyData[prevMonthKey];

            if (prevMonthData && prevMonthData.totalSales > 0) {
                const changePercent = ((data.totalSales - prevMonthData.totalSales) / prevMonthData.totalSales * 100).toFixed(1);
                const isPositive = changePercent >= 0;
                const color = isPositive ? '#4CAF50' : '#f44336';
                const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';

                changeText = `<span style="color: ${color};">
                    <i class="fas ${icon}"></i> ${isPositive ? '+' : ''}${changePercent}%
                </span>`;
            }
        }

        return `
            <tr>
                <td><strong>${formatMonth(monthKey)}</strong></td>
                <td>${orderCount}件</td>
                <td class="amount">¥${data.totalSales.toLocaleString()}</td>
                <td>¥${averageAmount.toLocaleString()}</td>
                <td>${data.completedCount}件</td>
                <td>${changeText}</td>
            </tr>
        `;
    }).join('');
}

// 日付フォーマット
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

// 月フォーマット
function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    return `${year}年${parseInt(month)}月`;
}

// タブ切り替え
function switchTab(tab) {
    currentTab = tab;

    // タブボタンのアクティブ状態を更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tab === 'daily') {
        document.getElementById('dailyTab').classList.add('active');
        renderDailySales();
    } else {
        document.getElementById('monthlyTab').classList.add('active');
        renderMonthlySales();
    }
}

// フィルターをリセット
function resetFilters() {
    document.getElementById('filterPeriod').value = 'thisMonth';
    document.getElementById('searchKeyword').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';

    document.querySelectorAll('#customDateGroup, #customDateGroup2').forEach(g => {
        g.style.display = 'none';
    });

    applyFilters();
}
