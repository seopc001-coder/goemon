// 五右衛門 ECサイト - ログインページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    initializePasswordToggle();
    initializeLoginForm();
    initializeSNSLogin();
    updateRegisterLink();
}

// 新規登録リンクにreturnUrlパラメータを追加
function updateRegisterLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');

    if (returnUrl) {
        const registerLink = document.querySelector('a[href="goemon-register.html"]');
        if (registerLink) {
            registerLink.href = `goemon-register.html?returnUrl=${returnUrl}`;
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

        // カートデータをlocalStorageからSupabaseに移行
        await migrateCartToSupabase(data.user.id);

        // カート移行完了後にログイン状態フラグを設定
        localStorage.setItem('goemonloggedin', 'true');

        // URLパラメータから戻り先URLを取得
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl') || '/';

        showAlertModal('ログインしました！', 'success');
        setTimeout(() => {
            window.location.href = decodeURIComponent(returnUrl);
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showAlertModal('ログイン処理中にエラーが発生しました。もう一度お試しください。', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * カートデータをlocalStorageからSupabaseに移行（既存カートとマージ）
 */
async function migrateCartToSupabase(userId) {
    try {
        // localStorageからカートデータを取得
        const localCart = JSON.parse(localStorage.getItem('goemoncart')) || [];

        if (localCart.length === 0) {
            console.log('移行するカートアイテムがありません');
            return;
        }

        console.log('カートアイテムを移行中:', localCart.length, '件');

        // Supabaseに既存のカートがあるか確認
        const existingCart = await fetchCartItems(userId);
        console.log('Supabase既存カート:', existingCart?.length || 0, '件');

        // Supabaseに各アイテムを追加（既存カートとマージ）
        for (const item of localCart) {
            // 同じ商品・色・サイズが既にSupabaseカートにあるか確認
            const existingItem = existingCart?.find(dbItem =>
                String(dbItem.productId) === String(item.id) &&
                (dbItem.color || '') === (item.color || '') &&
                (dbItem.size || '') === (item.size || '')
            );

            if (existingItem) {
                // 既存アイテムがある場合は数量を更新（既存 + 追加）
                const newQuantity = existingItem.quantity + item.quantity;
                console.log(`商品 ${item.id} の数量を更新: ${existingItem.quantity} → ${newQuantity}`);
                await updateCartItemQuantity(existingItem.id, newQuantity);
            } else {
                // 新規アイテムを追加
                console.log(`商品 ${item.id} を新規追加`);
                await addCartItemToDb(userId, {
                    productId: item.id,
                    quantity: item.quantity,
                    color: item.color || '',
                    size: item.size || ''
                });
            }
        }

        console.log('カートアイテムの移行が完了しました');

        // 移行完了後、localStorageのカートをクリア
        localStorage.removeItem('goemoncart');

    } catch (error) {
        console.error('カート移行エラー:', error);
        // エラーが発生してもログイン処理は継続
    }
}
