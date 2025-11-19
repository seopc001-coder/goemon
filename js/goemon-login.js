// 五右衛門 ECサイト - ログインページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    // 管理者アクセスチェック
    checkAdminAccess();

    initializePasswordToggle();
    initializeLoginForm();
    initializeSNSLogin();
}

// 管理者アクセスチェック
function checkAdminAccess() {
    const isAdminAccess = sessionStorage.getItem('adminAccess');
    if (isAdminAccess === 'true') {
        const adminNotice = document.getElementById('adminNotice');
        if (adminNotice) {
            adminNotice.style.display = 'block';
        }
    }
}

// パスワード表示切替
function initializePasswordToggle() {
    const toggleBtn = document.querySelector('.password-toggle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

// ログインフォーム処理
function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // エラーをクリア
        clearErrors();

        let isValid = true;

        // メールアドレス検証
        const email = document.getElementById('loginEmail').value;
        if (!email) {
            showError('loginEmailError', 'メールアドレスを入力してください');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('loginEmailError', '有効なメールアドレスを入力してください');
            isValid = false;
        }

        // パスワード検証
        const password = document.getElementById('loginPassword').value;
        if (!password) {
            showError('loginPasswordError', 'パスワードを入力してください');
            isValid = false;
        }

        if (isValid) {
            submitLogin(email, password);
        }
    });
}

// SNSログイン
function initializeSNSLogin() {
    const googleBtn = document.querySelector('.btn-google');
    const lineBtn = document.querySelector('.btn-line');

    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showAlertModal('Googleログイン（デモ版）\n実装時はGoogle OAuth APIと連携します', 'info');
        });
    }

    if (lineBtn) {
        lineBtn.addEventListener('click', function() {
            showAlertModal('LINEログイン（デモ版）\n実装時はLINE Login APIと連携します', 'info');
        });
    }
}

// メールアドレス検証
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// エラー表示
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');

        const input = errorElement.previousElementSibling?.querySelector('input');
        if (input) {
            input.classList.add('error');
        }
    }
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });

    const inputs = document.querySelectorAll('input.error');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// ログイン処理（Supabase連携）
async function submitLogin(email, password) {
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'ログイン中...';
    submitBtn.disabled = true;

    try {
        // Supabase Authでログイン
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // ログインエラー
            if (error.message.includes('Invalid login credentials')) {
                showError('loginPasswordError', 'メールアドレスまたはパスワードが正しくありません');
            } else {
                showAlertModal('ログインに失敗しました: ' + error.message, 'error');
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // メール認証チェック
        if (data?.user && !data.user.email_confirmed_at) {
            // メール未認証の場合はログイン拒否
            showAlertModal('メールアドレスが認証されていません。\n\n登録時に送信された確認メール内のリンクをクリックして、メール認証を完了してください。', 'warning');

            // ログアウト処理
            await supabase.auth.signOut();

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // 退会済みユーザーチェック
        if (data?.user?.user_metadata?.status === 'withdrawn') {
            showAlertModal('このアカウントは退会済みです。\n\n再度ご利用になる場合は、新規会員登録をお願いいたします。', 'error');

            // ログアウト処理
            await supabase.auth.signOut();

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // ログイン成功
        const rememberMe = document.getElementById('rememberMe').checked;

        if (rememberMe) {
            localStorage.setItem('goemonemail', email);
        }

        localStorage.setItem('goemonloggedin', 'true');

        // 管理者アクセスの場合は管理画面へリダイレクト
        const isAdminAccess = sessionStorage.getItem('adminAccess');
        if (isAdminAccess === 'true') {
            sessionStorage.removeItem('adminAccess');
            showAlertModal('管理画面へログインしました！', 'success');
            setTimeout(() => {
                window.location.href = 'goemon-admin.html';
            }, 1500);
        } else {
            showAlertModal('ログインしました！', 'success');
            setTimeout(() => {
                window.location.href = 'goemon-index.html';
            }, 1500);
        }

    } catch (error) {
        console.error('Login error:', error);
        showAlertModal('ログイン処理中にエラーが発生しました。もう一度お試しください。', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
