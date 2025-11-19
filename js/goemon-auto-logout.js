// 五右衛門 ECサイト - 自動ログアウト機能

// 自動ログアウト設定
const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30分（ミリ秒）
let logoutTimer = null;
let lastActivityTime = Date.now();

// 自動ログアウト初期化
function initializeAutoLogout() {
    // ログイン状態を確認
    checkLoginStatus();

    // ユーザーアクティビティをトラッキング
    trackUserActivity();

    // タイマーを開始
    startLogoutTimer();
}

// ログイン状態確認
async function checkLoginStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // ログインしていない場合は自動ログアウトを無効化
            stopLogoutTimer();
        }
    } catch (error) {
        console.error('Login status check error:', error);
    }
}

// ユーザーアクティビティをトラッキング
function trackUserActivity() {
    // トラッキングするイベント
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
        document.addEventListener(event, function() {
            lastActivityTime = Date.now();
            resetLogoutTimer();
        }, true);
    });
}

// ログアウトタイマー開始
function startLogoutTimer() {
    // 既存のタイマーをクリア
    if (logoutTimer) {
        clearTimeout(logoutTimer);
    }

    // 新しいタイマーを設定
    logoutTimer = setTimeout(async function() {
        const inactiveTime = Date.now() - lastActivityTime;

        // 30分以上操作がない場合
        if (inactiveTime >= AUTO_LOGOUT_TIME) {
            await performAutoLogout();
        } else {
            // まだ時間が残っている場合は再度タイマーをセット
            startLogoutTimer();
        }
    }, AUTO_LOGOUT_TIME);
}

// ログアウトタイマーリセット
function resetLogoutTimer() {
    startLogoutTimer();
}

// ログアウトタイマー停止
function stopLogoutTimer() {
    if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
    }
}

// 自動ログアウト実行
async function performAutoLogout() {
    try {
        // Supabaseからログアウト
        await supabase.auth.signOut();

        // ローカルストレージをクリア
        localStorage.removeItem('goemonloggedin');

        // ログインページにリダイレクト（メッセージなし）
        window.location.href = 'goemon-login.html';
    } catch (error) {
        console.error('Auto logout error:', error);
    }
}

// ページ読み込み時に初期化
if (typeof supabase !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeAutoLogout();
    });
}
