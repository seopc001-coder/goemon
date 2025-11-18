// 五右衛門 ECサイト - マイページ JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMyPage();
});

function initializeMyPage() {
    checkLoginStatus();
    initializeLogout();
    initializeEditLinks();
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
    const editProfileLinks = document.querySelectorAll('.section-header-mypage a[href="#"]');

    editProfileLinks.forEach(link => {
        const linkText = link.textContent.trim();

        if (linkText.includes('編集')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.closest('.mypage-section');
                const sectionTitle = section.querySelector('h2').textContent.trim();

                alert(`${sectionTitle}の編集機能は実装予定です`);
            });
        } else if (linkText.includes('詳細') || linkText.includes('すべて見る')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.closest('.mypage-section');
                const sectionTitle = section.querySelector('h2').textContent.trim();

                alert(`${sectionTitle}の詳細機能は実装予定です`);
            });
        }
    });
}
