// 五右衛門 ECサイト - マイページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMyPage();
});

function initializeMyPage() {
    checkLoginStatus();
    initializeLogout();
}

// ログイン状態を確認
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('goemonloggedin') === 'true';
    const loggedInContent = document.getElementById('loggedInContent');
    const notLoggedInContent = document.getElementById('notLoggedInContent');

    if (isLoggedIn) {
        loggedInContent.style.display = 'block';
        notLoggedInContent.style.display = 'none';
        loadUserInfo();
    } else {
        loggedInContent.style.display = 'none';
        notLoggedInContent.style.display = 'block';
    }
}

// ユーザー情報を読み込み
function loadUserInfo() {
    // メールアドレスを表示
    const email = localStorage.getItem('goemonemail') || 'メールアドレス未登録';
    const emailElement = document.getElementById('userEmail');
    if (emailElement) {
        emailElement.textContent = email;
    }

    // お気に入り数を表示
    const wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
    const favoritesCountElement = document.getElementById('favoritesCount');
    if (favoritesCountElement) {
        favoritesCountElement.textContent = `お気に入り: ${wishlist.length}件`;
    }
}

// ログアウト機能
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function() {
        if (confirm('ログアウトしますか?')) {
            // ログイン状態をクリア
            localStorage.removeItem('goemonloggedin');

            // メールアドレスは記憶している場合があるので削除しない
            // localStorage.removeItem('goemonemail');

            alert('ログアウトしました');
            window.location.href = 'goemon-index.html';
        }
    });
}
