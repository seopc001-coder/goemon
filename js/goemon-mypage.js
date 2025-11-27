// 五右衛門 ECサイト - マイページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMyPage();
});

function initializeMyPage() {
    checkLoginStatus();
    initializeLogout();
    initializeEditLinks();
    initializeAddressManagement();
    loadOrderHistory();
    displayPointRate();
}

// ログイン状態を確認（Supabase連携）
async function checkLoginStatus() {
    const loggedInContent = document.getElementById('loggedInContent');
    const notLoggedInContent = document.getElementById('notLoggedInContent');

    try {
        // Supabaseのセッションを確認
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            loggedInContent.style.display = 'block';
            notLoggedInContent.style.display = 'none';
            loadUserInfo(user);
        } else {
            loggedInContent.style.display = 'none';
            notLoggedInContent.style.display = 'block';
        }
    } catch (error) {
        console.error('Login check error:', error);
        loggedInContent.style.display = 'none';
        notLoggedInContent.style.display = 'block';
    }
}

// ユーザー情報を読み込み（Supabase連携）
async function loadUserInfo(user) {
    // デバッグ: user_metadataを確認
    console.log('Loading user info:', user.email);
    console.log('User metadata:', user.user_metadata);

    // メールアドレスを表示
    const emailElement = document.getElementById('userEmail');
    if (emailElement && user.email) {
        emailElement.textContent = user.email;
    }

    // お気に入り数を表示
    const wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
    const favoritesCountElement = document.getElementById('favoritesCount');
    if (favoritesCountElement) {
        favoritesCountElement.textContent = `お気に入り: ${wishlist.length}件`;
    }

    // ポイント残高を表示
    await loadUserPoints(user.id);

    // 住所情報を読み込み
    loadAddresses(user);
}

// ユーザーのポイント残高を読み込み
async function loadUserPoints(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const points = data?.points || 0;
        const pointsElement = document.getElementById('userPoints');
        if (pointsElement) {
            pointsElement.textContent = `${points.toLocaleString()} pt`;
        }
    } catch (error) {
        console.error('ポイント残高取得エラー:', error);
    }
}

// ログアウト機能（Supabase連携）
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutConfirmModal = document.getElementById('logoutConfirmModal');
    const logoutCompleteModal = document.getElementById('logoutCompleteModal');
    const closeLogoutConfirmModal = document.getElementById('closeLogoutConfirmModal');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    if (!logoutBtn) return;

    // ログアウトボタンクリック - 確認モーダルを表示
    logoutBtn.addEventListener('click', function() {
        logoutConfirmModal.classList.add('active');
        logoutConfirmModal.querySelector('.modal-cmn-container').classList.add('active');
    });

    // モーダルを閉じる
    const closeConfirmModal = () => {
        logoutConfirmModal.classList.remove('active');
        logoutConfirmModal.querySelector('.modal-cmn-container').classList.remove('active');
    };

    // 閉じるボタン
    closeLogoutConfirmModal.addEventListener('click', closeConfirmModal);

    // キャンセルボタン
    cancelLogoutBtn.addEventListener('click', closeConfirmModal);

    // モーダル外クリックで閉じる
    logoutConfirmModal.addEventListener('click', function(e) {
        if (e.target === logoutConfirmModal) {
            closeConfirmModal();
        }
    });

    // ログアウト実行
    confirmLogoutBtn.addEventListener('click', async function() {
        try {
            // 確認モーダルを閉じる
            closeConfirmModal();

            // Supabaseからログアウト
            await supabase.auth.signOut();

            // ローカルストレージをクリア
            localStorage.removeItem('goemonloggedin');
            localStorage.removeItem('goemoncart'); // カートデータもクリア

            // 完了モーダルを表示
            logoutCompleteModal.classList.add('active');
            logoutCompleteModal.querySelector('.modal-cmn-container').classList.add('active');

            // 2秒後にトップページへリダイレクト
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (error) {
            console.error('Logout error:', error);
            // エラーの場合もモーダルで表示（オプション）
            alert('ログアウト処理中にエラーが発生しました');
        }
    });
}

// 編集リンクの初期化
function initializeEditLinks() {
    // 会員情報編集リンク
    const editProfileLinks = document.querySelectorAll('.section-header-mypage a[href="#"]:not(#addAddressBtn)');

    editProfileLinks.forEach(link => {
        const linkText = link.textContent.trim();

        if (linkText.includes('編集')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.closest('.mypage-section');
                const sectionTitle = section.querySelector('h2').textContent.trim();

                // 会員情報セクションの場合は編集ページへ遷移
                if (sectionTitle.includes('会員情報')) {
                    window.location.href = 'goemon-edit-profile.html';
                } else {
                    alert(`${sectionTitle}の編集機能は実装予定です`);
                }
            });
        } else if (linkText.includes('詳細') || linkText.includes('すべて見る')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.closest('.mypage-section');
                const sectionTitle = section.querySelector('h2').textContent.trim();

                // 各セクションごとのページへ遷移
                if (sectionTitle.includes('注文履歴')) {
                    window.location.href = 'goemon-orders.html';
                } else if (sectionTitle.includes('お気に入り')) {
                    window.location.href = 'goemon-favorites.html';
                } else if (sectionTitle.includes('お届け先住所')) {
                    window.location.href = 'goemon-addresses.html';
                } else {
                    alert(`${sectionTitle}の詳細機能は実装予定です`);
                }
            });
        }
    });
}

// 住所管理機能（マイページでは表示のみ）
function initializeAddressManagement() {
    // マイページでは住所の表示のみ、編集は住所一覧ページで行う
}

// 住所情報を読み込み
async function loadAddresses(user) {
    try {
        const addresses = [];

        // user_profilesテーブルから登録住所を取得
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('postal_code, prefecture, city, address1, address2, phone, family_name, given_name')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.warn('プロファイル取得エラー:', profileError);
        }

        // プロファイルから登録住所を追加
        if (profile && profile.postal_code) {
            addresses.push({
                id: 'profile',
                name: `${profile.family_name || ''} ${profile.given_name || ''}`.trim() || '登録住所',
                postalCode: profile.postal_code || '',
                prefecture: profile.prefecture || '',
                city: profile.city || '',
                address1: profile.address1 || '',
                address2: profile.address2 || '',
                phone: profile.phone || '',
                isDefault: true
            });
        }

        // shipping_addressesテーブルから追加住所を取得
        const dbAddresses = await fetchShippingAddresses(user.id);

        if (dbAddresses && dbAddresses.length > 0) {
            // DB住所をアプリ用フォーマットに変換
            dbAddresses.forEach(addr => {
                addresses.push({
                    id: addr.id,
                    name: addr.address_name || `${addr.family_name || ''} ${addr.given_name || ''}`.trim(),
                    postalCode: addr.postal_code || '',
                    prefecture: addr.prefecture || '',
                    city: addr.city || '',
                    address1: addr.address1 || '',
                    address2: addr.address2 || '',
                    phone: addr.phone || '',
                    isDefault: addr.is_default || false
                });
            });
        }

        // 住所リストを表示
        displayAddresses(addresses);
        console.log('Loaded addresses from Supabase:', addresses.length);
    } catch (error) {
        console.error('Error loading addresses:', error);
        // エラー時はlocalStorageから読み込み（フォールバック）
        const savedAddresses = JSON.parse(localStorage.getItem('goemonaddresses')) || [];
        displayAddresses(savedAddresses);
    }
}

// 住所リストを表示
function displayAddresses(addresses) {
    const addressList = document.getElementById('addressList');
    const noAddressMessage = document.getElementById('noAddressMessage');

    if (!addressList) return;

    if (addresses.length === 0) {
        if (noAddressMessage) {
            noAddressMessage.style.display = 'block';
            noAddressMessage.textContent = '住所が登録されていません';
        }
        addressList.innerHTML = '';
        return;
    }

    // 住所が1件以上ある場合
    if (noAddressMessage) {
        noAddressMessage.style.display = 'block';
        noAddressMessage.textContent = `登録住所: ${addresses.length}件`;
        noAddressMessage.style.color = '#333';
        noAddressMessage.style.fontWeight = '500';
    }

    // マイページトップでは最初の1件のみ表示
    const displayAddrs = addresses.slice(0, 1);

    addressList.innerHTML = displayAddrs.map((addr, index) => `
        <div class="address-item" style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; background: #fff;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <strong style="font-size: 16px;">
                    ${addr.name || '配送先' + (index + 1)}
                    ${addr.isDefault ? '<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">登録住所</span>' : ''}
                </strong>
            </div>
            <p style="margin: 5px 0; color: #666;">
                〒${addr.postalCode}<br>
                ${addr.prefecture}${addr.city}${addr.address1}${addr.address2 ? ' ' + addr.address2 : ''}<br>
                ${addr.phone ? `電話番号: ${addr.phone}` : ''}
            </p>
        </div>
    `).join('');
}

// 住所を削除
async function deleteAddress(addressId) {
    showConfirmModal('この住所を削除しますか?', async () => {
        try {
            // プロファイル住所は削除不可
            if (addressId === 'profile') {
                showAlertModal('登録住所は削除できません', 'warning');
                return;
            }

            // Supabaseから削除
            await deleteShippingAddress(addressId);

            // 再読み込み
            checkLoginStatus();
            showAlertModal('住所を削除しました', 'success');
        } catch (error) {
            console.error('Error deleting address:', error);
            showAlertModal('住所の削除に失敗しました: ' + error.message, 'error');
        }
    });
}

// 注文履歴を読み込み（Supabase連携）
async function loadOrderHistory() {
    const orderHistoryMessage = document.getElementById('orderHistoryMessage');
    if (!orderHistoryMessage) return;

    try {
        // 現在のユーザーを取得
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            orderHistoryMessage.textContent = 'まだ注文がありません';
            return;
        }

        // Supabaseから該当ユーザーの注文履歴を取得
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            orderHistoryMessage.textContent = 'まだ注文がありません';
            return;
        }

        if (!orders || orders.length === 0) {
            orderHistoryMessage.textContent = 'まだ注文がありません';
            return;
        }

        // 未発送の注文があるかチェック
        const unshippedOrders = orders.filter(order => {
            // ステータスが「準備中」の場合は未発送
            return order.status === '準備中';
        });

        if (unshippedOrders.length > 0) {
            orderHistoryMessage.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff9800; margin-right: 5px;"></i>未発送の商品がございます';
        } else {
            orderHistoryMessage.textContent = 'こちらから注文状況が確認できます';
        }
    } catch (error) {
        console.error('Error loading order history:', error);
        orderHistoryMessage.textContent = 'まだ注文がありません';
    }
}

/**
 * ポイント付与レートを表示
 */
async function displayPointRate() {
    try {
        // サイト設定からポイント付与レートを取得
        let pointRate = 500; // デフォルト
        const rateSetting = await fetchSiteSetting('point_award_rate');
        if (rateSetting && rateSetting.value) {
            pointRate = parseInt(rateSetting.value);
        }

        // ポイント付与説明を更新
        const pointEarnInfo = document.getElementById('pointEarnInfo');
        if (pointEarnInfo) {
            pointEarnInfo.innerHTML = `<i class="fas fa-info-circle"></i> お買い物${pointRate.toLocaleString()}円（送料別）ごとに1ポイント付与されます`;
        }

        console.log('マイページ - ポイント付与レート表示:', pointRate);
    } catch (error) {
        console.error('ポイント付与レート表示エラー:', error);
        // エラー時はデフォルトの表示を維持
    }
}
