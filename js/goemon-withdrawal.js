// 五右衛門 ECサイト - 退会ページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeWithdrawalPage();
});

function initializeWithdrawalPage() {
    checkLoginStatus();
    initializeWithdrawalForm();
}

// ログイン状態を確認
async function checkLoginStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // 未ログインの場合はログインページへ
            window.location.href = 'goemon-login.html';
            return;
        }

        // ログイン中のユーザー情報を取得して表示
        loadUserInfo(user);
    } catch (error) {
        console.error('Login check error:', error);
        window.location.href = 'goemon-login.html';
    }
}

// ユーザー情報を読み込み
async function loadUserInfo(user) {
    // メールアドレスを自動入力
    const emailInput = document.getElementById('email');
    if (emailInput && user.email) {
        emailInput.value = user.email;
        emailInput.setAttribute('readonly', 'readonly');
    }

    // 電話番号を取得（user_metadataから）
    if (user.user_metadata && user.user_metadata.phone) {
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = user.user_metadata.phone;
        }
    }
}

// 退会フォーム初期化
function initializeWithdrawalForm() {
    const form = document.getElementById('withdrawalForm');
    const confirmModal = document.getElementById('confirmModal');
    const completeModal = document.getElementById('completeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmWithdrawalBtn = document.getElementById('confirmWithdrawalBtn');

    if (!form) return;

    // フォーム送信
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // バリデーション
        if (!validateForm()) {
            return;
        }

        // 確認モーダルを表示
        showModal(confirmModal);
    });

    // キャンセルボタン
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideModal(confirmModal);
        });
    }

    // 退会確定ボタン
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            await processWithdrawal();
        });
    }

    // モーダル外クリックで閉じる
    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            hideModal(confirmModal);
        }
    });
}

// フォームバリデーション
function validateForm() {
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const agreeCheckbox = document.getElementById('agreeCheckbox');

    if (!email) {
        showAlertModal('メールアドレスを入力してください', 'warning');
        return false;
    }

    if (!phone) {
        showAlertModal('電話番号を入力してください', 'warning');
        return false;
    }

    if (!password) {
        showAlertModal('パスワードを入力してください', 'warning');
        return false;
    }

    if (!agreeCheckbox.checked) {
        showAlertModal('注意事項に同意してください', 'warning');
        return false;
    }

    return true;
}

// 退会処理
async function processWithdrawal() {
    const confirmModal = document.getElementById('confirmModal');
    const completeModal = document.getElementById('completeModal');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        // パスワードを使用して再認証
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (signInError) {
            showAlertModal('メールアドレスまたはパスワードが正しくありません', 'error');
            hideModal(confirmModal);
            return;
        }

        // 配送中の注文があるかチェック
        const orders = JSON.parse(localStorage.getItem('goemonorders')) || [];
        const activeOrders = orders.filter(order => order.status === '準備中' || order.status === '配送中');

        if (activeOrders.length > 0) {
            showAlertModal('配送中の商品があるため、退会できません。\n商品の受け取り後に再度お試しください。', 'warning');
            hideModal(confirmModal);
            return;
        }

        // Supabaseアカウント削除（注意: 実際の本番環境では管理者権限が必要）
        // ここではローカルデータのクリアとログアウトのみ実行

        // ローカルストレージをクリア
        localStorage.removeItem('goemonloggedin');
        localStorage.removeItem('goemoncart');
        localStorage.removeItem('goemonwishlist');
        localStorage.removeItem('goemonorders');
        localStorage.removeItem('goemonaddresses');
        localStorage.removeItem('goemonappliedcoupon');

        // Supabaseからログアウト
        await supabase.auth.signOut();

        // 確認モーダルを閉じる
        hideModal(confirmModal);

        // 完了モーダルを表示
        showModal(completeModal);

        // 3秒後にトップページへリダイレクト
        setTimeout(() => {
            window.location.href = 'goemon-index.html';
        }, 3000);

    } catch (error) {
        console.error('Withdrawal error:', error);
        showAlertModal('退会処理中にエラーが発生しました。時間をおいて再度お試しください。', 'error');
        hideModal(confirmModal);
    }
}

// モーダル表示
function showModal(modal) {
    if (modal) {
        modal.classList.add('active');
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.add('active');
        }
    }
}

// モーダル非表示
function hideModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        const container = modal.querySelector('.modal-cmn-container');
        if (container) {
            container.classList.remove('active');
        }
    }
}
