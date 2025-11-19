// 五右衛門 ECサイト - ログインページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    initializePasswordToggle();
    initializeLoginForm();
    initializeSNSLogin();
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
            alert('Googleログイン（デモ版）\n実装時はGoogle OAuth APIと連携します');
        });
    }

    if (lineBtn) {
        lineBtn.addEventListener('click', function() {
            alert('LINEログイン（デモ版）\n実装時はLINE Login APIと連携します');
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
                alert('ログインに失敗しました: ' + error.message);
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // メール認証チェック
        if (data?.user && !data.user.email_confirmed_at) {
            // メール未認証の場合はログイン拒否
            alert('メールアドレスが認証されていません。\n\n登録時に送信された確認メール内のリンクをクリックして、メール認証を完了してください。');

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

        alert('ログインしました！');
        window.location.href = 'goemon-index.html';

    } catch (error) {
        console.error('Login error:', error);
        alert('ログイン処理中にエラーが発生しました。もう一度お試しください。');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
