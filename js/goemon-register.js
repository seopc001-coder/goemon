// 五右衛門 ECサイト - 会員登録ページ JavaScript

// ===================================
// DOMContentLoaded
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    initializeRegisterPage();
});

// ===================================
// 初期化
// ===================================
function initializeRegisterPage() {
    initializePasswordToggles();
    initializeBirthYearOptions();
    initializeBirthDayOptions();
    initializeFormValidation();
    initializeAddressSearch();
    initializeEmailDuplicateCheck();
}

// ===================================
// パスワード表示切替
// ===================================
function initializePasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
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
    });
}

// ===================================
// 生年月日の年選択肢を生成
// ===================================
function initializeBirthYearOptions() {
    const yearSelect = document.getElementById('birthYear');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;

    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// ===================================
// 生年月日の日選択肢を生成
// ===================================
function initializeBirthDayOptions() {
    const daySelect = document.getElementById('birthDay');
    if (!daySelect) return;

    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

// ===================================
// フォームバリデーション
// ===================================
function initializeFormValidation() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // すべてのエラーをクリア
        clearAllErrors();

        let isValid = true;

        // メールアドレス検証
        const email = document.getElementById('email').value;
        if (!validateEmail(email)) {
            showError('emailError', '有効なメールアドレスを入力してください');
            isValid = false;
        }

        // メールアドレス重複チェック
        if (validateEmail(email) && !checkEmailDuplicate(email)) {
            isValid = false;
        }

        // パスワード検証
        const password = document.getElementById('password').value;
        if (!validatePassword(password)) {
            showError('passwordError', 'パスワードは8文字以上の英数字で入力してください');
            isValid = false;
        }

        // パスワード確認検証
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        if (password !== passwordConfirm) {
            showError('passwordConfirmError', 'パスワードが一致しません');
            isValid = false;
        }

        // 必須項目検証
        const requiredFields = [
            { id: 'lastName', errorId: 'lastNameError', message: '姓を入力してください' },
            { id: 'firstName', errorId: 'firstNameError', message: '名を入力してください' },
            { id: 'lastNameKana', errorId: 'lastNameKanaError', message: 'セイを入力してください' },
            { id: 'firstNameKana', errorId: 'firstNameKanaError', message: 'メイを入力してください' },
            { id: 'postalCode', errorId: 'postalCodeError', message: '郵便番号を入力してください' },
            { id: 'prefecture', errorId: 'prefectureError', message: '都道府県を選択してください' },
            { id: 'city', errorId: 'cityError', message: '市区町村を入力してください' },
            { id: 'address1', errorId: 'address1Error', message: '番地を入力してください' },
            { id: 'phone', errorId: 'phoneError', message: '電話番号を入力してください' },
        ];

        requiredFields.forEach(field => {
            const value = document.getElementById(field.id).value;
            if (!value) {
                showError(field.errorId, field.message);
                isValid = false;
            }
        });

        // カナ検証
        const lastNameKana = document.getElementById('lastNameKana').value;
        const firstNameKana = document.getElementById('firstNameKana').value;
        if (!validateKatakana(lastNameKana)) {
            showError('lastNameKanaError', '全角カタカナで入力してください');
            isValid = false;
        }
        if (!validateKatakana(firstNameKana)) {
            showError('firstNameKanaError', '全角カタカナで入力してください');
            isValid = false;
        }

        // 郵便番号検証
        const postalCode = document.getElementById('postalCode').value;
        if (!validatePostalCode(postalCode)) {
            showError('postalCodeError', '7桁の数字で入力してください');
            isValid = false;
        }

        // 電話番号検証
        const phone = document.getElementById('phone').value;
        if (!validatePhone(phone)) {
            showError('phoneError', '10桁または11桁の数字で入力してください');
            isValid = false;
        }

        // 電話番号重複チェック
        const phoneClean = phone.replace(/-/g, '');
        const phoneExists = await checkPhoneDuplicate(phoneClean);
        if (phoneExists) {
            showError('phoneError', 'この電話番号は既に登録されています');
            isValid = false;
        }

        // 利用規約同意確認
        const terms = document.getElementById('terms').checked;
        if (!terms) {
            showError('termsError', '利用規約に同意してください');
            isValid = false;
        }

        if (isValid) {
            // フォーム送信処理
            submitRegistration();
        } else {
            // エラーがある場合は通知を表示
            showError('submitError', 'エラー項目がございます');

            // 最初のエラー項目までスクロール
            const firstError = document.querySelector('.form-error.visible');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}

// ===================================
// 住所自動入力
// ===================================
function initializeAddressSearch() {
    const searchBtn = document.getElementById('addressSearchBtn');
    if (!searchBtn) return;

    searchBtn.addEventListener('click', async function() {
        const postalCodeInput = document.getElementById('postalCode');
        const postalCode = postalCodeInput.value.replace(/-/g, '');

        if (!validatePostalCode(postalCode)) {
            alert('正しい郵便番号を入力してください（7桁の数字）');
            return;
        }

        // ボタンを無効化
        searchBtn.disabled = true;
        searchBtn.textContent = '検索中...';

        try {
            // zipcloud APIを使用して住所検索
            const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
            const data = await response.json();

            if (data.status === 200 && data.results) {
                const address = data.results[0];

                // 都道府県を設定
                document.getElementById('prefecture').value = address.address1;

                // 市区町村を設定
                document.getElementById('city').value = address.address2;

                // 町域を番地欄に設定
                document.getElementById('address1').value = address.address3;

                // 成功メッセージ
                alert('住所を自動入力しました');
            } else {
                alert('郵便番号に該当する住所が見つかりませんでした');
            }
        } catch (error) {
            console.error('Address search error:', error);
            alert('住所検索中にエラーが発生しました');
        } finally {
            // ボタンを再度有効化
            searchBtn.disabled = false;
            searchBtn.textContent = '住所を自動入力';
        }
    });
}

// ===================================
// グローバル変数
// ===================================
// デモ用の登録済みデータ（実際の実装ではサーバー側で管理）
const registeredEmails = ['test@example.com', 'demo@example.com'];

// ===================================
// メールアドレス重複チェック
// ===================================
function initializeEmailDuplicateCheck() {
    const emailInput = document.getElementById('email');
    if (!emailInput) return;

    let emailCheckTimeout = null;

    emailInput.addEventListener('input', function() {
        const email = this.value.trim();

        // タイムアウトをクリア（連続入力時は最後の入力から500ms後にチェック）
        clearTimeout(emailCheckTimeout);

        // エラーをクリア
        const emailError = document.getElementById('emailError');
        emailError.textContent = '';
        emailError.classList.remove('visible');

        if (!email || !validateEmail(email)) {
            return;
        }

        // 500ms後にチェック実行
        emailCheckTimeout = setTimeout(() => {
            checkEmailDuplicate(email);
        }, 500);
    });
}

async function checkEmailDuplicate(email) {
    // Supabaseでメールアドレス重複チェック
    try {
        // デモ用のローカルチェック
        if (registeredEmails.includes(email)) {
            showError('emailError', 'このメールアドレスは既に登録されています');
            return false;
        }

        // Supabase Auth APIでチェック（実装時）
        // 注: Supabase Authでは登録前の重複チェックAPIがないため、
        // 登録時にエラーで判定するか、別途usersテーブルを作成する必要がある

        return true;
    } catch (error) {
        console.error('Email check error:', error);
        return true; // エラー時は続行を許可
    }
}

// ===================================
// 電話番号重複チェック
// ===================================
async function checkPhoneDuplicate(phone) {
    try {
        // Supabase usersテーブルで電話番号重複チェック
        const { data, error } = await supabase
            .from('users')
            .select('phone')
            .eq('phone', phone)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = 該当データなし（重複なし）以外のエラー
            console.error('Phone check error:', error);
            return false; // エラー時は続行を許可
        }

        // データが存在する = 重複あり
        return data !== null;
    } catch (error) {
        console.error('Phone check error:', error);
        return false; // エラー時は続行を許可
    }
}

// ===================================
// バリデーション関数
// ===================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

function validateKatakana(text) {
    const re = /^[ァ-ヴー]+$/;
    return re.test(text);
}

function validatePostalCode(code) {
    const re = /^[0-9]{7}$/;
    return re.test(code);
}

function validatePhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone);
}

// ===================================
// エラー表示
// ===================================
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');

        // 対応する入力フィールドにエラークラスを追加
        const input = errorElement.previousElementSibling?.querySelector('input, select');
        if (input) {
            input.classList.add('error');
        }
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });

    const inputs = document.querySelectorAll('input.error, select.error');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// ===================================
// 登録処理
// ===================================
async function submitRegistration() {
    // ローディング表示
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '登録中...';
    submitBtn.disabled = true;

    try {
        // フォームデータ取得
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const lastName = document.getElementById('lastName').value;
        const firstName = document.getElementById('firstName').value;
        const phone = document.getElementById('phone').value.replace(/-/g, '');

        // Supabase Authで会員登録
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/goemon-login.html',
                data: {
                    last_name: lastName,
                    first_name: firstName,
                    phone: phone,
                }
            }
        });

        if (error) {
            // エラーハンドリング
            if (error.message.includes('already registered')) {
                showError('emailError', 'このメールアドレスは既に登録されています');
            } else {
                alert('登録に失敗しました: ' + error.message);
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // usersテーブルに電話番号を保存（Auth登録成功後）
        if (data?.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    user_id: data.user.id,
                    phone: phone
                });

            if (dbError) {
                console.error('Failed to save user data:', dbError);
                // 電話番号保存に失敗してもAuth登録は成功しているので続行
            }
        }

        // 登録成功
        alert('会員登録が完了しました！\n確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');

        // トップページにリダイレクト
        window.location.href = 'goemon-index.html';

    } catch (error) {
        console.error('Registration error:', error);
        alert('登録処理中にエラーが発生しました。もう一度お試しください。');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
