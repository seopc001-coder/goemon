// 五右衛門 ECサイト - 共通モーダル機能

// グローバルモーダル関数
window.showAlertModal = function(message, type = 'info') {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('globalAlertModal');
    if (existingModal) {
        existingModal.remove();
    }

    // アイコンと色を設定
    let icon, iconColor;
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            iconColor = '#4CAF50';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            iconColor = '#f44336';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            iconColor = '#ff9800';
            break;
        default:
            icon = 'fa-info-circle';
            iconColor = '#2196F3';
    }

    // モーダルHTML生成
    const modalHTML = `
        <div class="modal-overlay" id="globalAlertModal" style="z-index: 10000;">
            <div class="modal-cmn-container" style="max-width: 400px;">
                <div class="modal-content" style="text-align: center; padding: 40px 30px;">
                    <i class="fas ${icon}" style="font-size: 48px; color: ${iconColor}; margin-bottom: 20px;"></i>
                    <p style="color: #333; line-height: 1.8; margin-bottom: 30px; white-space: pre-line;">${message}</p>
                    <button type="button" class="btn-cmn-02" id="alertModalOkBtn" style="width: 100%; padding: 12px;">
                        OK
                    </button>
                </div>
            </div>
        </div>
    `;

    // DOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // モーダル表示
    const modal = document.getElementById('globalAlertModal');
    const container = modal.querySelector('.modal-cmn-container');

    // 表示アニメーション
    setTimeout(() => {
        modal.classList.add('active');
        container.classList.add('active');
    }, 10);

    // OKボタンとモーダル外クリックでモーダルを閉じる
    const okBtn = document.getElementById('alertModalOkBtn');

    const closeModal = () => {
        modal.classList.remove('active');
        container.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    okBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
};

// 確認モーダル（OK/キャンセル）
window.showConfirmModal = function(message, onConfirm, onCancel) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('globalConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    // モーダルHTML生成
    const modalHTML = `
        <div class="modal-overlay" id="globalConfirmModal" style="z-index: 10000;">
            <div class="modal-cmn-container" style="max-width: 400px;">
                <div class="modal-content" style="text-align: center; padding: 40px 30px;">
                    <i class="fas fa-question-circle" style="font-size: 48px; color: #ff9800; margin-bottom: 20px;"></i>
                    <p style="color: #333; line-height: 1.8; margin-bottom: 30px; white-space: pre-line;">${message}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <button type="button" class="btn-cmn-01" id="confirmModalCancelBtn" style="padding: 12px;">
                            キャンセル
                        </button>
                        <button type="button" class="btn-cmn-02" id="confirmModalOkBtn" style="padding: 12px;">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // DOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // モーダル表示
    const modal = document.getElementById('globalConfirmModal');
    const container = modal.querySelector('.modal-cmn-container');

    // 表示アニメーション
    setTimeout(() => {
        modal.classList.add('active');
        container.classList.add('active');
    }, 10);

    // ボタンイベント
    const okBtn = document.getElementById('confirmModalOkBtn');
    const cancelBtn = document.getElementById('confirmModalCancelBtn');

    const closeModal = () => {
        modal.classList.remove('active');
        container.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    okBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
            if (onCancel) onCancel();
        }
    });
};
