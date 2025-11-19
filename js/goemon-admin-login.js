// 五右衛門 ECサイト - 管理者ログイン JavaScript

// 管理者認証情報（本番環境では環境変数やデータベースで管理すべき）
const ADMIN_CREDENTIALS = {
    id: 'admin',
    password: 'admin'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminLogin();
});

function initializeAdminLogin() {
    // パスワード表示切替
    initializePasswordToggle();

    // ログインフォーム
    initializeLoginForm();

    // 既にログイン済みかチェック
    checkExistingAdminSession();
}

// パスワード表示切替
function initializePasswordToggle() {
    const toggleBtn = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('adminPassword');

    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

// ログインフォーム初期化
function initializeLoginForm() {
    const form = document.getElementById('adminLoginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleAdminLogin();
    });
}

// 既存の管理者セッションチェック
function checkExistingAdminSession() {
    const adminSession = sessionStorage.getItem('adminAuthenticated');
    if (adminSession === 'true') {
        // 既にログイン済みの場合は管理画面へリダイレクト
        window.location.href = 'goemon-admin.html';
    }
}

// 管理者ログイン処理
async function handleAdminLogin() {
    const adminId = document.getElementById('adminId').value.trim();
    const adminPassword = document.getElementById('adminPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // エラーメッセージをクリア
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';

    // バリデーション
    if (!adminId) {
        showError('管理者IDを入力してください');
        return;
    }

    if (!adminPassword) {
        showError('パスワードを入力してください');
        return;
    }

    // ボタンを無効化
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 認証中...';
    loginBtn.disabled = true;

    // 認証処理（少し遅延を入れて認証感を出す）
    await new Promise(resolve => setTimeout(resolve, 800));

    // 認証チェック
    if (adminId === ADMIN_CREDENTIALS.id && adminPassword === ADMIN_CREDENTIALS.password) {
        // ログイン成功
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminId', adminId);
        sessionStorage.setItem('adminLoginTime', new Date().toISOString());

        showAlertModal('管理者認証に成功しました', 'success');

        setTimeout(() => {
            window.location.href = 'goemon-admin.html';
        }, 1500);
    } else {
        // ログイン失敗
        showError('管理者IDまたはパスワードが正しくありません');
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;

        // 入力をクリア
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminId').focus();
    }
}

// エラーメッセージを表示
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // 3秒後に自動的に消す
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 3000);
}
