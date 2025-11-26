// ===================================
// 五右衛門 ECサイト - パスワード再設定
// ===================================

console.log('goemon-reset-password.js loaded');

let accessToken = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOMContentLoaded - Reset Password Page');

    // URLからトークンを取得
    await checkResetToken();

    // フォーム送信イベント
    document.getElementById('resetPasswordForm')?.addEventListener('submit', handleResetPassword);

    // パスワード入力時のバリデーション
    document.getElementById('newPassword')?.addEventListener('input', validatePassword);
    document.getElementById('confirmPassword')?.addEventListener('input', validatePassword);
});

/**
 * リセットトークンの確認
 */
async function checkResetToken() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resetForm = document.getElementById('resetPasswordForm');

    try {
        // URLハッシュからアクセストークンとリフレッシュトークンを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 Token check:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type: type
        });

        if (!accessToken || type !== 'recovery') {
            throw new Error('無効なリセットリンクです');
        }

        // セッションを設定
        console.log('🔄 セッションを設定中...');
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        if (error) throw error;

        console.log('✅ セッション設定完了:', data);

        // トークンが有効な場合、フォームを表示
        loadingSpinner.style.display = 'none';
        resetForm.style.display = 'block';

        console.log('✅ トークン確認完了');
    } catch (error) {
        console.error('トークン確認エラー:', error);
        loadingSpinner.style.display = 'none';
        showAlert('error', error.message || 'リセットリンクが無効または期限切れです。新しいリンクをリクエストしてください。');
    }
}

/**
 * パスワードリセット処理
 */
async function handleResetPassword(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btnSubmit = document.getElementById('btnSubmit');

    // バリデーション
    if (newPassword.length < 8) {
        showAlert('error', 'パスワードは8文字以上で入力してください');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('error', 'パスワードが一致しません');
        return;
    }

    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 処理中...';

        console.log('🔄 パスワード更新中...');

        // Supabaseでパスワード更新
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        console.log('✅ パスワード更新完了:', data);

        // 成功メッセージ
        showAlert('success', 'パスワードが正常に更新されました。3秒後にログインページに移動します...');

        // フォームを非表示
        document.getElementById('resetPasswordForm').style.display = 'none';

        // 3秒後にログインページにリダイレクト
        setTimeout(() => {
            window.location.href = 'https://goemon-flame.vercel.app/goemon-login.html';
        }, 3000);

    } catch (error) {
        console.error('パスワードリセットエラー:', error);
        showAlert('error', 'パスワードの更新に失敗しました: ' + error.message);

        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-check"></i> パスワードを再設定';
    }
}

/**
 * パスワード表示/非表示の切り替え
 */
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

/**
 * パスワードのバリデーション
 */
function validatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 長さチェック
    const lengthReq = document.getElementById('req-length');
    if (newPassword.length >= 8) {
        lengthReq.classList.add('valid');
    } else {
        lengthReq.classList.remove('valid');
    }

    // 一致チェック
    const matchReq = document.getElementById('req-match');
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
        matchReq.classList.add('valid');
    } else {
        matchReq.classList.remove('valid');
    }

    // 送信ボタンの有効/無効
    const btnSubmit = document.getElementById('btnSubmit');
    if (newPassword.length >= 8 && newPassword === confirmPassword) {
        btnSubmit.disabled = false;
    } else {
        btnSubmit.disabled = true;
    }
}

/**
 * アラート表示
 */
function showAlert(type, message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.className = `alert-box ${type}`;

    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    alertBox.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    alertBox.style.display = 'block';

    // 成功メッセージは自動で消さない（リダイレクトするため）
    if (type === 'error') {
        // エラーメッセージは5秒後に自動で消す
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}
