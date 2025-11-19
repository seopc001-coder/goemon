// 五右衛門 ECサイト - クーポン管理 JavaScript

let allCoupons = [];
let editingCouponId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCouponManagement();
});

async function initializeCouponManagement() {
    // 管理者権限チェック
    await checkAdminAccess();

    // クーポンデータを読み込み
    loadCoupons();

    // フォーム送信イベント
    document.getElementById('couponForm').addEventListener('submit', handleCouponFormSubmit);

    // 明日の日付をデフォルトに設定
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('expiryDate').min = tomorrow.toISOString().split('T')[0];
}

// 管理者権限チェック
async function checkAdminAccess() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            showAlertModal('管理者としてログインしてください', 'warning');
            setTimeout(() => {
                window.location.href = 'goemon-login.html';
            }, 1500);
            return;
        }

        console.log('Admin access granted for:', user.email);
    } catch (error) {
        console.error('Admin check error:', error);
        window.location.href = 'goemon-login.html';
    }
}

// クーポンデータを読み込み
function loadCoupons() {
    try {
        const savedCoupons = localStorage.getItem('goemoncoupons');
        if (savedCoupons) {
            allCoupons = JSON.parse(savedCoupons);
        } else {
            // デフォルトクーポンを作成
            allCoupons = [
                {
                    id: 'WELCOME2025',
                    code: 'WELCOME2025',
                    type: 'percentage',
                    value: 10,
                    minPurchase: 3000,
                    maxDiscount: 1000,
                    expiryDate: '2025-12-31',
                    usageLimit: null,
                    usedCount: 0,
                    description: '新規会員様限定！10%OFF',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'SPRING500',
                    code: 'SPRING500',
                    type: 'fixed',
                    value: 500,
                    minPurchase: 5000,
                    maxDiscount: null,
                    expiryDate: '2025-03-31',
                    usageLimit: 100,
                    usedCount: 23,
                    description: '春のキャンペーン 500円OFF',
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('goemoncoupons', JSON.stringify(allCoupons));
        }

        renderCoupons(allCoupons);
    } catch (error) {
        console.error('Error loading coupons:', error);
        showAlertModal('クーポンデータの読み込みに失敗しました', 'error');
    }
}

// クーポンを表示
function renderCoupons(coupons) {
    const grid = document.getElementById('couponsGrid');
    const countElem = document.getElementById('couponCount');

    countElem.textContent = coupons.length;

    if (coupons.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <h3 style="margin-bottom: 10px;">クーポンがありません</h3>
                <p>新規クーポン作成ボタンからクーポンを追加してください</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = coupons.map(coupon => {
        const isExpired = new Date(coupon.expiryDate) < new Date();
        const isUsageLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
        const isActive = !isExpired && !isUsageLimitReached;

        const discountText = coupon.type === 'percentage' ?
            `${coupon.value}% OFF` :
            `¥${coupon.value.toLocaleString()} OFF`;

        return `
            <div class="coupon-card">
                <div class="coupon-header">
                    <div class="coupon-code">${coupon.code}</div>
                    <div class="coupon-discount">${discountText}</div>
                    <span class="status-badge ${isActive ? 'active' : 'expired'}" style="position: absolute; top: 15px; right: 15px;">
                        ${isActive ? '有効' : '無効'}
                    </span>
                </div>
                <div class="coupon-body">
                    ${coupon.description ? `
                        <p style="color: #666; margin-bottom: 15px; font-size: 14px;">${coupon.description}</p>
                    ` : ''}

                    <div class="coupon-info">
                        ${coupon.minPurchase > 0 ? `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">最小購入金額:</span>
                                <span class="coupon-info-value">¥${coupon.minPurchase.toLocaleString()}</span>
                            </div>
                        ` : ''}

                        ${coupon.maxDiscount ? `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">最大割引:</span>
                                <span class="coupon-info-value">¥${coupon.maxDiscount.toLocaleString()}</span>
                            </div>
                        ` : ''}

                        <div class="coupon-info-item">
                            <span class="coupon-info-label">有効期限:</span>
                            <span class="coupon-info-value">${formatDate(new Date(coupon.expiryDate))}</span>
                        </div>

                        ${coupon.usageLimit ? `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">使用状況:</span>
                                <span class="coupon-info-value">${coupon.usedCount || 0} / ${coupon.usageLimit}</span>
                            </div>
                        ` : `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">使用回数:</span>
                                <span class="coupon-info-value">${coupon.usedCount || 0} 回</span>
                            </div>
                        `}
                    </div>

                    <div class="coupon-actions">
                        <button class="btn-small btn-edit" onclick="editCoupon('${coupon.id}')">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteCoupon('${coupon.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 日付をフォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
}

// 割引ラベルを更新
function updateDiscountLabel() {
    const type = document.getElementById('couponType').value;
    const label = document.getElementById('discountLabel');

    if (type === 'percentage') {
        label.innerHTML = '割引率（%） <span style="color: #f44336;">*</span>';
        document.getElementById('couponValue').max = 100;
    } else {
        label.innerHTML = '割引額（円） <span style="color: #f44336;">*</span>';
        document.getElementById('couponValue').removeAttribute('max');
    }
}

// クーポン追加モーダルを開く
function openAddCouponModal() {
    editingCouponId = null;

    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> クーポンを作成';
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';

    // 明日の日付をデフォルトに設定
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('expiryDate').value = tomorrow.toISOString().split('T')[0];

    const modal = document.getElementById('couponModal');
    modal.classList.add('active');
}

// クーポン編集モーダルを開く
function editCoupon(couponId) {
    const coupon = allCoupons.find(c => c.id === couponId);

    if (!coupon) {
        showAlertModal('クーポンが見つかりません', 'error');
        return;
    }

    editingCouponId = couponId;

    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> クーポンを編集';
    document.getElementById('couponId').value = couponId;
    document.getElementById('couponCode').value = coupon.code;
    document.getElementById('couponType').value = coupon.type;
    document.getElementById('couponValue').value = coupon.value;
    document.getElementById('minPurchase').value = coupon.minPurchase || 0;
    document.getElementById('maxDiscount').value = coupon.maxDiscount || '';
    document.getElementById('expiryDate').value = coupon.expiryDate;
    document.getElementById('usageLimit').value = coupon.usageLimit || '';
    document.getElementById('couponDescription').value = coupon.description || '';

    updateDiscountLabel();

    const modal = document.getElementById('couponModal');
    modal.classList.add('active');
}

// クーポンフォーム送信処理
function handleCouponFormSubmit(e) {
    e.preventDefault();

    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseInt(document.getElementById('couponValue').value);
    const minPurchase = parseInt(document.getElementById('minPurchase').value) || 0;
    const maxDiscount = parseInt(document.getElementById('maxDiscount').value) || null;
    const expiryDate = document.getElementById('expiryDate').value;
    const usageLimit = parseInt(document.getElementById('usageLimit').value) || null;
    const description = document.getElementById('couponDescription').value.trim();

    // バリデーション
    if (!code) {
        showAlertModal('クーポンコードを入力してください', 'warning');
        return;
    }

    if (code.length < 4) {
        showAlertModal('クーポンコードは4文字以上で入力してください', 'warning');
        return;
    }

    if (value <= 0) {
        showAlertModal('割引値は1以上で入力してください', 'warning');
        return;
    }

    if (type === 'percentage' && value > 100) {
        showAlertModal('割引率は100%以下で入力してください', 'warning');
        return;
    }

    if (new Date(expiryDate) < new Date()) {
        showAlertModal('有効期限は明日以降の日付を指定してください', 'warning');
        return;
    }

    // 重複チェック
    if (!editingCouponId) {
        const existingCoupon = allCoupons.find(c => c.code === code);
        if (existingCoupon) {
            showAlertModal('このクーポンコードは既に使用されています', 'warning');
            return;
        }
    }

    if (editingCouponId) {
        // 編集モード
        const index = allCoupons.findIndex(c => c.id === editingCouponId);
        if (index !== -1) {
            allCoupons[index] = {
                ...allCoupons[index],
                code,
                type,
                value,
                minPurchase,
                maxDiscount,
                expiryDate,
                usageLimit,
                description
            };
        }

        showAlertModal('クーポンを更新しました', 'success');
    } else {
        // 新規追加モード
        const newCoupon = {
            id: code,
            code,
            type,
            value,
            minPurchase,
            maxDiscount,
            expiryDate,
            usageLimit,
            usedCount: 0,
            description,
            createdAt: new Date().toISOString()
        };

        allCoupons.push(newCoupon);

        showAlertModal('クーポンを作成しました', 'success');
    }

    // localStorageに保存
    localStorage.setItem('goemoncoupons', JSON.stringify(allCoupons));

    // モーダルを閉じる
    closeCouponModal();

    // クーポンリストを再表示
    renderCoupons(allCoupons);
}

// クーポンを削除
function deleteCoupon(couponId) {
    const coupon = allCoupons.find(c => c.id === couponId);

    if (!coupon) {
        showAlertModal('クーポンが見つかりません', 'error');
        return;
    }

    showConfirmModal(
        `クーポン「${coupon.code}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
        () => {
            allCoupons = allCoupons.filter(c => c.id !== couponId);
            localStorage.setItem('goemoncoupons', JSON.stringify(allCoupons));

            showAlertModal('クーポンを削除しました', 'success');
            renderCoupons(allCoupons);
        }
    );
}

// クーポンモーダルを閉じる
function closeCouponModal() {
    const modal = document.getElementById('couponModal');
    modal.classList.remove('active');
    document.getElementById('couponForm').reset();
    editingCouponId = null;
}

// モーダル外クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('couponModal');

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeCouponModal();
            }
        });
    }
});
