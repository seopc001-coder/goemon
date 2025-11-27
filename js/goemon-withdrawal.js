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

        // 論理削除: ユーザーステータスを「退会済み」に更新
        const withdrawalReason = document.getElementById('reason').value.trim();
        const withdrawalData = {
            status: 'withdrawn',
            deleted_at: new Date().toISOString(),
            deletion_reason: withdrawalReason || null
        };

        // Supabaseのユーザーメタデータを更新
        const { error: updateError } = await supabase.auth.updateUser({
            data: withdrawalData
        });

        if (updateError) {
            console.error('Update user metadata error:', updateError);
            showAlertModal('退会処理中にエラーが発生しました', 'error');
            hideModal(confirmModal);
            return;
        }

        // 退会ユーザー情報を管理用に保存
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const withdrawnUserRecord = {
            userId: currentUser.id,
            email: email,
            deleted_at: withdrawalData.deleted_at,
            deletion_reason: withdrawalData.deletion_reason,
            withdrawal_timestamp: Date.now()
        };

        // 管理用に退会ユーザーリストに追加
        const withdrawnUsers = JSON.parse(localStorage.getItem('goemonwithdrawnusers')) || [];
        withdrawnUsers.push(withdrawnUserRecord);
        localStorage.setItem('goemonwithdrawnusers', JSON.stringify(withdrawnUsers));

        // 注文履歴は保持（法的要件のため削除しない）
        // localStorage.removeItem('goemonorders'); // 保持

        // その他のローカルデータをクリア
        localStorage.removeItem('goemonloggedin');
        localStorage.removeItem('goemoncart');
        localStorage.removeItem('goemonwishlist');
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
            window.location.href = '/';
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
