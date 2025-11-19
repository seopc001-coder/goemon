// 五右衛門 ECサイト - 会員情報編集 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkLoginAndLoadProfile();
    initializeFormSubmit();
});

// ログイン確認とプロフィール読み込み
async function checkLoginAndLoadProfile() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('ログインが必要です');
            window.location.href = 'goemon-login.html';
            return;
        }

        // ユーザー情報を表示
        loadUserProfile(user);
    } catch (error) {
        console.error('Login check error:', error);
        alert('ログイン状態の確認に失敗しました');
        window.location.href = 'goemon-login.html';
    }
}

// ユーザープロフィールを読み込み
function loadUserProfile(user) {
    // メールアドレス
    document.getElementById('email').value = user.email || '';

    // user_metadataから情報を取得
    const metadata = user.user_metadata || {};

    document.getElementById('lastName').value = metadata.lastName || '';
    document.getElementById('firstName').value = metadata.firstName || '';
    document.getElementById('lastNameKana').value = metadata.lastNameKana || '';
    document.getElementById('firstNameKana').value = metadata.firstNameKana || '';
    document.getElementById('phone').value = metadata.phone || '';
}

// フォーム送信処理
function initializeFormSubmit() {
    const form = document.getElementById('editProfileForm');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveProfile();
        });
    }
}

// プロフィール保存
async function saveProfile() {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
    submitBtn.disabled = true;

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('ログインしていません');
        }

        // パスワード変更のバリデーション
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                alert('パスワードが一致しません');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            if (newPassword.length < 8) {
                alert('パスワードは8文字以上で設定してください');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
        }

        // 更新データを作成
        const updatedData = {
            lastName: document.getElementById('lastName').value,
            firstName: document.getElementById('firstName').value,
            lastNameKana: document.getElementById('lastNameKana').value,
            firstNameKana: document.getElementById('firstNameKana').value,
            phone: document.getElementById('phone').value
        };

        // Supabaseのuser_metadataを更新
        const updateOptions = {
            data: updatedData
        };

        // パスワードが入力されている場合は更新
        if (newPassword) {
            updateOptions.password = newPassword;
        }

        const { error } = await supabase.auth.updateUser(updateOptions);

        if (error) {
            throw error;
        }

        alert('会員情報を更新しました');
        window.location.href = 'goemon-mypage.html';

    } catch (error) {
        console.error('Save error:', error);
        alert('会員情報の更新に失敗しました: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
