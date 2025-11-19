// 五右衛門 ECサイト - 住所管理 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkLoginAndLoadAddresses();
    initializeAddressManagement();
});

// ログイン確認と住所読み込み
async function checkLoginAndLoadAddresses() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('ログインが必要です');
            window.location.href = 'goemon-login.html';
            return;
        }

        // 住所情報を読み込み
        loadAddresses(user);
    } catch (error) {
        console.error('Login check error:', error);
        alert('ログイン状態の確認に失敗しました');
        window.location.href = 'goemon-login.html';
    }
}

// 住所情報を読み込み
async function loadAddresses(user) {
    try {
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
    const addressListContainer = document.getElementById('addressListContainer');
    const emptyAddress = document.getElementById('emptyAddress');
    const addressCount = document.getElementById('addressCount');

    // 件数を表示
    addressCount.textContent = `${addresses.length}件の住所`;

    if (addresses.length === 0) {
        emptyAddress.style.display = 'block';
        addressListContainer.innerHTML = '';
        return;
    }

    emptyAddress.style.display = 'none';
    addressListContainer.innerHTML = addresses.map((addr, index) => `
        <div class="address-item" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; background: #fff;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <strong style="font-size: 18px; display: block; margin-bottom: 5px;">
                        ${addr.name || '配送先' + (index + 1)}
                        ${addr.isDefault ? '<span style="background: #4CAF50; color: white; padding: 2px 10px; border-radius: 4px; font-size: 12px; margin-left: 10px;">登録住所</span>' : ''}
                    </strong>
                </div>
                ${!addr.isDefault ? `
                    <button class="btn-delete-address" data-id="${addr.id}" style="color: #f44336; background: none; border: 1px solid #f44336; border-radius: 4px; padding: 8px 15px; cursor: pointer; font-size: 14px; transition: all 0.3s;">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                ` : ''}
            </div>
            <div style="color: #666; line-height: 1.8;">
                <p style="margin: 5px 0;">
                    <strong>郵便番号:</strong> 〒${addr.postalCode}
                </p>
                <p style="margin: 5px 0;">
                    <strong>住所:</strong> ${addr.prefecture}${addr.city}${addr.address1}${addr.address2 ? ' ' + addr.address2 : ''}
                </p>
                ${addr.phone ? `
                    <p style="margin: 5px 0;">
                        <strong>電話番号:</strong> ${addr.phone}
                    </p>
                ` : ''}
            </div>
        </div>
    `).join('');

    // 削除ボタンのイベントリスナーを追加
    const deleteButtons = document.querySelectorAll('.btn-delete-address');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const addressId = this.getAttribute('data-id');
            deleteAddress(addressId);
        });

        // ホバーエフェクト
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#f44336';
            this.style.color = 'white';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.background = 'none';
            this.style.color = '#f44336';
        });
    });
}

// 住所管理機能の初期化
function initializeAddressManagement() {
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addAddressBtnEmpty = document.getElementById('addAddressBtnEmpty');
    const addressModal = document.getElementById('addressModal');
    const addressModalOverlay = document.getElementById('addressModalOverlay');
    const closeAddressModal = document.getElementById('closeAddressModal');
    const cancelAddressBtn = document.getElementById('cancelAddressBtn');
    const addAddressForm = document.getElementById('addAddressForm');
    const searchAddressBtn = document.getElementById('searchAddressBtn');

    // モーダルを開く
    const openModal = function(e) {
        e.preventDefault();
        addressModal.style.display = 'block';
        addressModalOverlay.style.display = 'block';
    };

    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', openModal);
    }

    if (addAddressBtnEmpty) {
        addAddressBtnEmpty.addEventListener('click', openModal);
    }

    // モーダルを閉じる
    const closeModal = function() {
        addressModal.style.display = 'none';
        addressModalOverlay.style.display = 'none';
        addAddressForm.reset();
    };

    if (closeAddressModal) {
        closeAddressModal.addEventListener('click', closeModal);
    }

    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', closeModal);
    }

    if (addressModalOverlay) {
        addressModalOverlay.addEventListener('click', closeModal);
    }

    // 郵便番号から住所検索
    if (searchAddressBtn) {
        searchAddressBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const postalCode = document.getElementById('newPostalCode').value.replace(/[^0-9]/g, '');

            if (postalCode.length !== 7) {
                alert('7桁の郵便番号を入力してください');
                return;
            }

            try {
                const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
                const data = await response.json();

                if (data.results) {
                    const result = data.results[0];
                    document.getElementById('newPrefecture').value = result.address1;
                    document.getElementById('newCity').value = result.address2 + result.address3;
                } else {
                    alert('住所が見つかりませんでした');
                }
            } catch (error) {
                console.error('Address search error:', error);
                alert('住所の検索に失敗しました');
            }
        });
    }

    // フォーム送信
    if (addAddressForm) {
        addAddressForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const newAddress = {
                id: Date.now().toString(),
                name: document.getElementById('newAddressName').value,
                postalCode: document.getElementById('newPostalCode').value,
                prefecture: document.getElementById('newPrefecture').value,
                city: document.getElementById('newCity').value,
                address1: document.getElementById('newAddress1').value,
                address2: document.getElementById('newAddress2').value,
                phone: document.getElementById('newPhone').value,
                isDefault: false
            };

            try {
                // localStorageに保存
                const addresses = JSON.parse(localStorage.getItem('goemonaddresses')) || [];
                addresses.push(newAddress);
                localStorage.setItem('goemonaddresses', JSON.stringify(addresses));

                // モーダルを閉じる
                closeModal();

                // 住所リストを再読み込み
                checkLoginAndLoadAddresses();
                alert('住所を追加しました');
            } catch (error) {
                console.error('Error saving address:', error);
                alert('住所の保存に失敗しました');
            }
        });
    }
}

// 住所を削除
function deleteAddress(addressId) {
    if (!confirm('この住所を削除しますか?')) return;

    try {
        const addresses = JSON.parse(localStorage.getItem('goemonaddresses')) || [];
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        localStorage.setItem('goemonaddresses', JSON.stringify(updatedAddresses));

        // 再読み込み
        checkLoginAndLoadAddresses();
        alert('住所を削除しました');
    } catch (error) {
        console.error('Error deleting address:', error);
        alert('住所の削除に失敗しました');
    }
}
