// 五右衛門 ECサイト - チェックアウトページ JavaScript
console.log('🔵 CHECKOUT.JS VERSION 2 LOADED - 2025-11-26');
console.log('🔍 Checking dependencies:');
console.log('  - supabase:', typeof supabase);
console.log('  - fetchPublishedProducts:', typeof fetchPublishedProducts);
console.log('  - fetchCartItems:', typeof fetchCartItems);

let checkoutCartItems = [];
let checkoutProductsData = {};
let checkoutCurrentUser = null;
let checkoutUserPoints = 0; // ユーザーの保有ポイント
let checkoutPointsToUse = 0; // 利用するポイント

// 商品データを初期化
async function initializeCheckoutProductsData() {
    try {
        const products = await fetchPublishedProducts();
        checkoutProductsData = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        console.log('Loaded products from Supabase for checkout:', Object.keys(checkoutProductsData).length);
    } catch (error) {
        console.error('Error loading products from Supabase:', error);
        checkoutProductsData = {};
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // 商品データを初期化
    await initializeCheckoutProductsData();

    // ログイン状態を確認
    await checkCheckoutLoginStatus();

    // ポイント情報を読み込み
    await loadCheckoutUserPoints();

    // カートデータを読み込み
    await loadCheckoutCartData();

    // 注文サマリーを表示
    renderCheckoutOrderSummary();

    // ポイント入力フィールドのイベント
    const pointsInput = document.getElementById('pointsToUse');
    if (pointsInput) {
        pointsInput.addEventListener('input', handleCheckoutPointsInput);
    }

    // 確認ボタンのイベント
    document.getElementById('btnConfirmOrder').addEventListener('click', handleCheckoutConfirmOrder);
});

// ログイン状態を確認
async function checkCheckoutLoginStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            checkoutCurrentUser = user;
            // ユーザー情報から配送先を自動入力
            autofillCheckoutShippingInfo(user);
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// ユーザー情報から配送先を自動入力
function autofillCheckoutShippingInfo(user) {
    const metadata = user.user_metadata;
    if (metadata) {
        if (metadata.lastName) document.getElementById('lastName').value = metadata.lastName;
        if (metadata.firstName) document.getElementById('firstName').value = metadata.firstName;
        if (metadata.postalCode) document.getElementById('postalCode').value = metadata.postalCode;
        if (metadata.prefecture) document.getElementById('prefecture').value = metadata.prefecture;
        if (metadata.city) document.getElementById('city').value = metadata.city;
        if (metadata.address1) document.getElementById('address1').value = metadata.address1;
        if (metadata.address2) document.getElementById('address2').value = metadata.address2;
        if (metadata.phone) document.getElementById('phone').value = metadata.phone;
    }
}

// カートデータを読み込み（認証ユーザーはSupabase、ゲストはlocalStorage）
async function loadCheckoutCartData() {
    console.log('=== loadCartData開始 ===');
    try {
        // まずlocalStorageのログイン状態フラグをチェック
        const isLoggedIn = localStorage.getItem('goemonloggedin') === 'true';
        console.log('localStorage goemonloggedin:', isLoggedIn);

        // Supabaseで認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Supabase session exists:', !!session);
        console.log('Supabase user exists:', !!session?.user);

        // 両方でログイン状態を確認（より確実）
        if (isLoggedIn && session?.user) {
            // 認証ユーザー: Supabaseからカートを読み込み
            console.log('>>> 認証ユーザーとして処理します');
            const userId = session.user.id;
            const dbCartItems = await fetchCartItems(userId);

            // DBのフォーマットをアプリ用に変換
            checkoutCartItems = dbCartItems.map(item => ({
                id: item.product_id,
                name: '', // 商品データから取得
                price: 0, // 商品データから取得
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                cartItemId: item.id // DB上のカートアイテムID
            }));

            console.log('Supabaseからカートを読み込み:', checkoutCartItems.length, 'items');
            console.log('カートアイテム:', checkoutCartItems);
        } else {
            // ゲストユーザー: localStorageから読み込み
            console.log('>>> ゲストユーザーとして処理します');
            const rawCart = localStorage.getItem('goemoncart');
            console.log('Raw localStorage data:', rawCart);
            checkoutCartItems = JSON.parse(rawCart) || [];
            console.log('localStorageからカートを読み込み:', checkoutCartItems.length, 'items');
            console.log('カートアイテム:', checkoutCartItems);
        }
    } catch (error) {
        console.error('カート読み込みエラー:', error);
        // エラー時はlocalStorageから読み込み
        const rawCart = localStorage.getItem('goemoncart');
        console.log('エラーフォールバック - Raw localStorage:', rawCart);
        checkoutCartItems = JSON.parse(rawCart) || [];
        console.log('エラーフォールバック - localStorageからカートを読み込み:', checkoutCartItems.length, 'items');
    }
    console.log('=== loadCartData完了 ===');

    // カートが空の場合はカートページにリダイレクト
    if (checkoutCartItems.length === 0) {
        showAlertModal('カートが空です', 'warning');
        setTimeout(() => {
            window.location.href = '/cart';
        }, 1500);
    }
}

// 注文サマリーを表示
function renderCheckoutOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const subtotalElem = document.getElementById('subtotal');
    const shippingElem = document.getElementById('shipping');
    const totalElem = document.getElementById('total');

    let subtotal = 0;

    orderSummary.innerHTML = checkoutCartItems.map(item => {
        const product = checkoutProductsData[item.id];
        const itemTotal = (product ? product.price : item.price) * item.quantity;
        subtotal += itemTotal;

        return `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <p style="font-weight: 500;">${product ? product.name : item.name}</p>
                    <p style="color: #666; font-size: 14px;">数量: ${item.quantity}</p>
                </div>
                <p style="font-weight: bold;">¥${itemTotal.toLocaleString()}</p>
            </div>
        `;
    }).join('');

    // 送料計算（¥5,000以上で送料無料）
    const shipping = subtotal >= 5000 ? 0 : 500;
    const total = subtotal + shipping;

    subtotalElem.textContent = `¥${subtotal.toLocaleString()}`;
    shippingElem.textContent = `¥${shipping.toLocaleString()}`;
    totalElem.textContent = `¥${total.toLocaleString()}`;

    // 獲得予定ポイントを計算して表示（合計金額の1%）
    const earnedPoints = Math.floor(total * 0.01);
    const earnedPointsElem = document.getElementById('earnedPoints');
    if (earnedPointsElem) {
        earnedPointsElem.textContent = `${earnedPoints} pt`;
    }
}

// 注文を確認
function handleCheckoutConfirmOrder() {
    // フォームのバリデーション
    const lastName = document.getElementById('lastName').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const prefecture = document.getElementById('prefecture').value;
    const city = document.getElementById('city').value.trim();
    const address1 = document.getElementById('address1').value.trim();
    const address2 = document.getElementById('address2').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    // 必須項目のチェック
    if (!lastName || !firstName || !postalCode || !prefecture || !city || !address1 || !phone) {
        showAlertModal('必須項目をすべて入力してください', 'warning');
        return;
    }

    // 郵便番号のバリデーション
    if (!/^[0-9]{7}$/.test(postalCode)) {
        showAlertModal('郵便番号は7桁の数字で入力してください', 'warning');
        return;
    }

    // 電話番号のバリデーション
    if (!/^[0-9]{10,11}$/.test(phone)) {
        showAlertModal('電話番号は10桁または11桁の数字で入力してください', 'warning');
        return;
    }

    // 注文データを作成
    const subtotal = calculateCheckoutSubtotal();
    const shipping = subtotal >= 5000 ? 0 : 500; // ¥5,000以上で送料無料
    const pointDiscount = checkoutPointsToUse;
    const total = Math.max(0, subtotal + shipping - pointDiscount);
    const earnedPoints = Math.floor(total * 0.01);

    const orderData = {
        shippingAddress: {
            name: `${lastName} ${firstName}`,
            lastName,
            firstName,
            postalCode,
            prefecture,
            city,
            address1,
            address2,
            phone
        },
        paymentMethod,
        items: checkoutCartItems,
        subtotal: subtotal,
        shipping: shipping,
        pointDiscount: pointDiscount,
        total: total,
        earnedPoints: earnedPoints,
        usedPoints: checkoutPointsToUse
    };

    // セッションストレージに保存して確認ページへ
    sessionStorage.setItem('checkoutData', JSON.stringify(orderData));
    window.location.href = 'goemon-order-confirm.html';
}

// 小計を計算
function calculateCheckoutSubtotal() {
    return checkoutCartItems.reduce((sum, item) => {
        const product = checkoutProductsData[item.id];
        return sum + ((product ? product.price : item.price) * item.quantity);
    }, 0);
}

// ユーザーのポイント情報を読み込み
async function loadCheckoutUserPoints() {
    try {
        if (!checkoutCurrentUser) {
            console.log('ログインしていないため、ポイント情報は表示しません');
            return;
        }

        // user_metadataからポイントを取得
        const points = checkoutCurrentUser.user_metadata?.points || 0;
        checkoutUserPoints = points;

        // UIに表示
        const availablePointsElem = document.getElementById('availablePoints');
        if (availablePointsElem) {
            availablePointsElem.textContent = `${checkoutUserPoints.toLocaleString()} pt`;
        }

        console.log('保有ポイント:', checkoutUserPoints);
    } catch (error) {
        console.error('ポイント情報の読み込みエラー:', error);
    }
}

// ポイント入力の処理
function handleCheckoutPointsInput(event) {
    const input = parseInt(event.target.value) || 0;
    const subtotal = calculateCheckoutSubtotal();
    const shipping = subtotal >= 5000 ? 0 : 500; // ¥5,000以上で送料無料
    const maxUsablePoints = Math.min(checkoutUserPoints, subtotal + shipping);

    // 入力値を制限
    if (input > maxUsablePoints) {
        event.target.value = maxUsablePoints;
        checkoutPointsToUse = maxUsablePoints;
        showAlertModal(`利用可能ポイントは${maxUsablePoints}ptまでです`, 'warning');
    } else if (input < 0) {
        event.target.value = 0;
        checkoutPointsToUse = 0;
    } else {
        checkoutPointsToUse = input;
    }

    // 注文サマリーを再計算
    updateCheckoutOrderSummary();
}

// 注文サマリーを更新（ポイント適用後）
function updateCheckoutOrderSummary() {
    const subtotal = calculateCheckoutSubtotal();
    const shipping = subtotal >= 5000 ? 0 : 500; // ¥5,000以上で送料無料
    const pointDiscount = checkoutPointsToUse;
    const total = Math.max(0, subtotal + shipping - pointDiscount);

    // 獲得ポイント（合計金額の1%、1円未満切り捨て）
    const earnedPoints = Math.floor(total * 0.01);

    // UIを更新
    document.getElementById('subtotal').textContent = `¥${subtotal.toLocaleString()}`;
    document.getElementById('shipping').textContent = `¥${shipping.toLocaleString()}`;

    // ポイント割引の表示/非表示
    const pointDiscountRow = document.getElementById('pointDiscountRow');
    const pointDiscountElem = document.getElementById('pointDiscount');
    if (pointDiscount > 0) {
        pointDiscountRow.style.display = 'flex';
        pointDiscountElem.textContent = `-¥${pointDiscount.toLocaleString()}`;
    } else {
        pointDiscountRow.style.display = 'none';
    }

    document.getElementById('total').textContent = `¥${total.toLocaleString()}`;
    document.getElementById('earnedPoints').textContent = `${earnedPoints} pt`;
}
