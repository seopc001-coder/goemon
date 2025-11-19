// 五右衛門 ECサイト - 注文完了ページ JavaScript
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // 注文完了ページを表示したことがあるかチェック
        const orderCompleteViewed = sessionStorage.getItem('orderCompleteViewed');

        if (orderCompleteViewed === 'true') {
            // 2回目以降のアクセスは注文履歴ページへリダイレクト
            window.location.href = 'goemon-orders.html';
            return;
        }

        // セッションストレージから完了した注文を取得
        const completedOrderData = sessionStorage.getItem('completedOrder');

        if (!completedOrderData) {
            // 注文データがない場合は注文履歴ページへリダイレクト
            window.location.href = 'goemon-orders.html';
            return;
        }

        try {
            const order = JSON.parse(completedOrderData);

            // 注文情報を表示
            displayOrderInfo(order);

            // 表示済みフラグを立てる
            sessionStorage.setItem('orderCompleteViewed', 'true');

            // セッションストレージから注文データをクリア（表示後）
            sessionStorage.removeItem('completedOrder');

        } catch (error) {
            console.error('Error parsing order data:', error);
            window.location.href = 'goemon-orders.html';
        }
    });

    // 注文情報を表示
    function displayOrderInfo(order) {
        // 注文番号
        document.getElementById('orderId').textContent = order.orderId;

        // 注文日時
        const orderDate = new Date(order.orderDate);
        const formattedDate = `${orderDate.getFullYear()}年${orderDate.getMonth() + 1}月${orderDate.getDate()}日 ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
        document.getElementById('orderDate').textContent = formattedDate;

        // 合計金額
        document.getElementById('orderTotal').textContent = `¥${order.totalAmount.toLocaleString()}`;
    }

})();
