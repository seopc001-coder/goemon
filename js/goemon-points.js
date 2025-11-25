// 五右衛門 ECサイト - ポイントページ JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    await checkLoginAndLoadPoints();
});

/**
 * ログイン状態を確認してポイント情報を読み込み
 */
async function checkLoginAndLoadPoints() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // 未ログインの場合はログインページへリダイレクト
            window.location.href = 'goemon-login.html?redirect=goemon-points.html';
            return;
        }

        // ポイント情報を読み込み
        await loadPointsData(user.id);
    } catch (error) {
        console.error('ログイン確認エラー:', error);
        window.location.href = 'goemon-login.html?redirect=goemon-points.html';
    }
}

/**
 * ポイントデータを読み込んで表示
 */
async function loadPointsData(userId) {
    try {
        // ポイント残高を取得
        const points = await fetchUserPoints(userId);
        displayPointsBalance(points);

        // ポイント履歴を取得
        const history = await fetchPointHistory(userId, 100);
        displayPointsHistory(history);

        // ポイント付与レートを取得して表示
        await displayPointRate();

    } catch (error) {
        console.error('ポイントデータ読み込みエラー:', error);
        showAlertModal('ポイント情報の読み込みに失敗しました', 'error');
    }
}

/**
 * ポイント残高を表示
 */
function displayPointsBalance(points) {
    const balanceElement = document.getElementById('pointsBalance');
    const valueElement = document.getElementById('pointsValue');

    if (balanceElement) {
        balanceElement.textContent = `${points.toLocaleString()} pt`;
    }

    if (valueElement) {
        valueElement.textContent = `${points.toLocaleString()}円相当`;
    }
}

/**
 * ポイント履歴を表示
 */
function displayPointsHistory(history) {
    const historyList = document.getElementById('historyList');

    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = `
            <li class="empty-history">
                <i class="fas fa-inbox"></i>
                <p>ポイント履歴がありません</p>
            </li>
        `;
        return;
    }

    // 履歴をフォーマット
    const formattedHistory = formatPointHistory(history);

    historyList.innerHTML = formattedHistory.map(item => `
        <li class="history-item">
            <div class="history-info">
                <div class="history-date">${item.date} ${item.time}</div>
                <div class="history-reason">${item.reason}</div>
                ${item.orderId ? `<div class="history-order">注文ID: ${item.orderId}</div>` : ''}
            </div>
            <div class="history-points">
                <div class="points-amount ${item.isPositive ? 'positive' : 'negative'}">
                    ${item.isPositive ? '+' : ''}${item.points.toLocaleString()} pt
                </div>
                <div class="points-balance-after">残高: ${item.balanceAfter.toLocaleString()} pt</div>
            </div>
        </li>
    `).join('');
}

/**
 * ポイント付与レートを表示
 */
async function displayPointRate() {
    try {
        // サイト設定からポイント付与レートを取得
        let pointRate = 500; // デフォルト
        const rateSetting = await fetchSiteSetting('point_award_rate');
        if (rateSetting && rateSetting.value) {
            pointRate = parseInt(rateSetting.value);
        }

        // ポイント付与説明を更新
        const pointEarnInfo = document.getElementById('pointEarnInfo');
        if (pointEarnInfo) {
            pointEarnInfo.textContent = `お買い物${pointRate.toLocaleString()}円（送料別）ごとに1ポイント付与されます`;
        }

        console.log('ポイント付与レート表示:', pointRate);
    } catch (error) {
        console.error('ポイント付与レート表示エラー:', error);
        // エラー時はデフォルトの表示を維持
    }
}
