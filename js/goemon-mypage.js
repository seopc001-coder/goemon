// 五右衛門 ECサイト - マイページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMyPage();
});

function initializeMyPage() {
    checkLoginStatus();
    initializeLogout();
    initializeEditLinks();
    initializeAddressManagement();
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
function loadUserInfo(user) {
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

    // 住所情報を読み込み
    loadAddresses(user);
}

// ログアウト機能（Supabase連携）
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async function() {
        if (confirm('ログアウトしますか?')) {
            try {
                // Supabaseからログアウト
                await supabase.auth.signOut();

                // ローカルストレージをクリア
                localStorage.removeItem('goemonloggedin');

                alert('ログアウトしました');
                window.location.href = 'goemon-index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('ログアウト処理中にエラーが発生しました');
            }
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

                // お気に入りセクションの場合はお気に入りページへ遷移
                if (sectionTitle.includes('お気に入り')) {
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
        // Supabaseから住所データを取得
        const addresses = [];

        // 会員登録時の住所を取得（user.user_metadataから）
        if (user.user_metadata) {
            const metadata = user.user_metadata;
            if (metadata.postalCode || metadata.prefecture || metadata.city || metadata.address1) {
                addresses.push({
                    id: 'default',
                    name: `${metadata.lastName || ''} ${metadata.firstName || ''}`.trim() || '登録住所',
                    postalCode: metadata.postalCode || '',
                    prefecture: metadata.prefecture || '',
                    city: metadata.city || '',
                    address1: metadata.address1 || '',
                    address2: metadata.address2 || '',
                    phone: metadata.phone || '',
                    isDefault: true
                });
            }
        }

        // localStorageから追加の住所を取得
        const savedAddresses = JSON.parse(localStorage.getItem('goemonaddresses')) || [];
        addresses.push(...savedAddresses);

        // 住所リストを表示
        displayAddresses(addresses);
    } catch (error) {
        console.error('Error loading addresses:', error);
    }
}

// 住所リストを表示
function displayAddresses(addresses) {
    const addressList = document.getElementById('addressList');
    const noAddressMessage = document.getElementById('noAddressMessage');

    if (!addressList) return;

    if (addresses.length === 0) {
        noAddressMessage.style.display = 'block';
        addressList.innerHTML = '';
        return;
    }

    noAddressMessage.style.display = 'none';
    addressList.innerHTML = addresses.map((addr, index) => `
        <div class="address-item" style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; background: #fff;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <strong style="font-size: 16px;">
                    ${addr.name || '配送先' + (index + 1)}
                    ${addr.isDefault ? '<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">登録住所</span>' : ''}
                </strong>
                ${!addr.isDefault ? `<button class="btn-delete-address" data-id="${addr.id}" style="color: #f44336; background: none; border: none; cursor: pointer; font-size: 14px;"><i class="fas fa-trash"></i> 削除</button>` : ''}
            </div>
            <p style="margin: 5px 0; color: #666;">
                〒${addr.postalCode}<br>
                ${addr.prefecture}${addr.city}${addr.address1}${addr.address2 ? ' ' + addr.address2 : ''}<br>
                ${addr.phone ? `電話番号: ${addr.phone}` : ''}
            </p>
        </div>
    `).join('');

    // 削除ボタンのイベントリスナーを追加
    const deleteButtons = document.querySelectorAll('.btn-delete-address');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const addressId = this.getAttribute('data-id');
            deleteAddress(addressId);
        });
    });
}

// 住所を削除
function deleteAddress(addressId) {
    if (!confirm('この住所を削除しますか?')) return;

    try {
        const addresses = JSON.parse(localStorage.getItem('goemonaddresses')) || [];
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        localStorage.setItem('goemonaddresses', JSON.stringify(updatedAddresses));

        // 再読み込み
        checkLoginStatus();
        alert('住所を削除しました');
    } catch (error) {
        console.error('Error deleting address:', error);
        alert('住所の削除に失敗しました');
    }
}
