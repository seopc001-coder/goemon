// ===================================
// 五右衛門 ECサイト - クーポン管理 (Supabase版)
// ===================================

console.log('goemon-admin-coupons-v2.js loaded');

let allCoupons = [];
let editingCouponId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Coupons Management');
    initializeCoupons();
});

async function initializeCoupons() {
    // 管理者権限チェック
    await checkAdminAccess();

    // Supabaseからクーポンを読み込み
    await loadCoupons();

    // イベントリスナー設定
    document.getElementById('couponForm')?.addEventListener('submit', handleCouponFormSubmit);

    // 検索機能
    document.getElementById('searchCouponBtn')?.addEventListener('click', searchCoupons);
    document.getElementById('couponSearch')?.addEventListener('input', searchCoupons);

    console.log('Coupons management initialized');
}

/**
 * クーポンをSupabaseから読み込み
 */
async function loadCoupons() {
    try {
        console.log('📥 Supabaseからクーポンを取得中...');
        allCoupons = await fetchAllCoupons();
        console.log('✅ クーポン取得完了:', allCoupons.length, '件');
        renderCoupons();
    } catch (error) {
        console.error('クーポン読み込みエラー:', error);
        showAlertModal('クーポンデータの読み込みに失敗しました', 'error');
    }
}

/**
 * クーポンを表示
 */
function renderCoupons() {
    const grid = document.getElementById('couponsGrid');
    const countElem = document.getElementById('couponCount');

    if (!grid) {
        console.error('couponsGrid element not found');
        return;
    }

    // カウント更新
    if (countElem) {
        countElem.textContent = allCoupons.length;
    }

    if (allCoupons.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <h3>クーポンがありません</h3>
                <p>新規クーポン作成ボタンからクーポンを追加してください</p>
            </div>
        `;
        return;
    }

    // 作成日時の降順でソート
    const sortedCoupons = [...allCoupons].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    grid.innerHTML = sortedCoupons.map(coupon => {
        const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
        const isUsageLimitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
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
                        ${coupon.min_purchase || coupon.minPurchase ? `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">最小購入金額:</span>
                                <span class="coupon-info-value">¥${(coupon.min_purchase || coupon.minPurchase).toLocaleString()}</span>
                            </div>
                        ` : ''}

                        ${coupon.max_discount || coupon.maxDiscount ? `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">最大割引:</span>
                                <span class="coupon-info-value">¥${(coupon.max_discount || coupon.maxDiscount).toLocaleString()}</span>
                            </div>
                        ` : ''}

                        <div class="coupon-info-item">
                            <span class="coupon-info-label">有効期限:</span>
                            <span class="coupon-info-value">${formatDate(new Date(coupon.expiry_date))}</span>
                        </div>

                        ${coupon.usage_limit || coupon.usageLimit ? `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">使用状況:</span>
                                <span class="coupon-info-value">${coupon.used_count || 0} / ${coupon.usage_limit || coupon.usageLimit}</span>
                            </div>
                        ` : `
                            <div class="coupon-info-item">
                                <span class="coupon-info-label">使用回数:</span>
                                <span class="coupon-info-value">${coupon.used_count || 0} 回</span>
                            </div>
                        `}
                    </div>

                    <div class="coupon-actions">
                        <button class="btn-small btn-edit" onclick="editCoupon('${coupon.id}')">
                            <i class="fas fa-edit"></i> 編集
                        </button>
                    <button class="btn-small btn-delete" onclick="confirmDeleteCoupon('${coupon.id}')">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * クーポン追加モーダルを開く
 */
window.openAddCouponModal = function() {
    editingCouponId = null;
    document.getElementById('couponModalTitle').innerHTML = '<i class="fas fa-plus"></i> クーポンを追加';
    document.getElementById('couponForm').reset();

    // デフォルト値設定
    document.getElementById('couponActive').checked = true;
    document.getElementById('couponDiscountType').value = 'percentage';

    const modal = document.getElementById('couponModal');
    modal.style.display = 'flex';
};

/**
 * クーポン編集モーダルを開く
 */
window.editCoupon = function(couponId) {
    const coupon = allCoupons.find(c => c.id === couponId);
    if (!coupon) {
        showAlertModal('クーポンが見つかりません', 'error');
        return;
    }

    editingCouponId = couponId;
    document.getElementById('couponModalTitle').innerHTML = '<i class="fas fa-edit"></i> クーポンを編集';

    // フォームに値をセット
    document.getElementById('couponCode').value = coupon.code;
    document.getElementById('couponName').value = coupon.name || '';
    document.getElementById('couponDescription').value = coupon.description || '';
    document.getElementById('couponDiscountType').value = coupon.discount_type;
    document.getElementById('couponDiscountValue').value = coupon.discount_value;
    document.getElementById('couponMinPurchase').value = coupon.min_purchase_amount || '';
    document.getElementById('couponMaxDiscount').value = coupon.max_discount_amount || '';
    document.getElementById('couponUsageLimit').value = coupon.usage_limit || '';
    document.getElementById('couponValidFrom').value = coupon.valid_from ? coupon.valid_from.split('T')[0] : '';
    document.getElementById('couponValidUntil').value = coupon.valid_until ? coupon.valid_until.split('T')[0] : '';
    document.getElementById('couponActive').checked = coupon.is_active !== false;

    const modal = document.getElementById('couponModal');
    modal.style.display = 'flex';
};

/**
 * クーポンフォーム送信処理
 */
async function handleCouponFormSubmit(e) {
    e.preventDefault();

    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const name = document.getElementById('couponName').value.trim();
    const description = document.getElementById('couponDescription').value.trim();
    const discountType = document.getElementById('couponDiscountType').value;
    const discountValue = parseInt(document.getElementById('couponDiscountValue').value);
    const minPurchase = parseInt(document.getElementById('couponMinPurchase').value) || 0;
    const maxDiscount = parseInt(document.getElementById('couponMaxDiscount').value) || null;
    const usageLimit = parseInt(document.getElementById('couponUsageLimit').value) || null;
    const validFrom = document.getElementById('couponValidFrom').value || null;
    const validUntil = document.getElementById('couponValidUntil').value || null;
    const isActive = document.getElementById('couponActive').checked;

    if (!code || !name || !discountValue) {
        showAlertModal('必須項目を入力してください', 'error');
        return;
    }

    // バリデーション
    if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
        showAlertModal('割引率は1〜100%の範囲で入力してください', 'error');
        return;
    }

    try {
        const couponData = {
            code,
            name,
            description,
            discount_type: discountType,
            discount_value: discountValue,
            min_purchase_amount: minPurchase,
            max_discount_amount: maxDiscount,
            usage_limit: usageLimit,
            valid_from: validFrom,
            valid_until: validUntil,
            is_active: isActive
        };

        if (editingCouponId) {
            // 更新
            console.log('🔄 クーポンを更新中...', editingCouponId);
            await updateCoupon(editingCouponId, couponData);
            showAlertModal('クーポンを更新しました', 'success');
        } else {
            // 新規追加
            console.log('➕ クーポンを追加中...');
            await addCoupon(couponData);
            showAlertModal('クーポンを追加しました', 'success');
        }

        closeCouponModal();
        await loadCoupons();
    } catch (error) {
        console.error('クーポン保存エラー:', error);
        showAlertModal('クーポンの保存に失敗しました: ' + error.message, 'error');
    }
}

/**
 * クーポン削除確認
 */
window.confirmDeleteCoupon = async function(couponId) {
    const coupon = allCoupons.find(c => c.id === couponId);
    if (!coupon) return;

    if (!confirm(`クーポン「${coupon.code}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
        return;
    }

    try {
        console.log('🗑️ クーポンを削除中...', couponId);
        await deleteCoupon(couponId);
        showAlertModal('クーポンを削除しました', 'success');
        await loadCoupons();
    } catch (error) {
        console.error('クーポン削除エラー:', error);
        showAlertModal('クーポンの削除に失敗しました: ' + error.message, 'error');
    }
};

/**
 * クーポン検索
 */
function searchCoupons() {
    const searchTerm = document.getElementById('couponSearch')?.value.toLowerCase() || '';

    const filteredCoupons = allCoupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm) ||
        (coupon.name && coupon.name.toLowerCase().includes(searchTerm)) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchTerm))
    );

    // 一時的にフィルタ結果を表示
    const originalCoupons = allCoupons;
    allCoupons = filteredCoupons;
    renderCoupons();
    allCoupons = originalCoupons;
}

/**
 * クーポンモーダルを閉じる
 */
function closeCouponModal() {
    document.getElementById('couponModal').style.display = 'none';
    editingCouponId = null;
}

/**
 * 日付フォーマット
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// モーダル制御
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close') || e.target.classList.contains('btn-cancel')) {
        const modal = e.target.closest('.modal');
        if (modal) modal.style.display = 'none';
    }
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
