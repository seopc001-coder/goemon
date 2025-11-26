// 五右衛門 ECサイト - メインJavaScript

// ===================================
// グローバル変数
// ===================================
let cart = JSON.parse(localStorage.getItem('goemoncart')) || [];
let wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];

// ===================================
// DOMContentLoaded
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ===================================
// 初期化関数
// ===================================
function initializeApp() {
    // Swiperの初期化
    initializeSwiper();

    // モバイルメニューの初期化
    initializeMobileMenu();

    // 検索機能の初期化
    initializeSearch();

    // お気に入り機能の初期化
    initializeWishlist();

    // モーダルの初期化
    initializeModal();

    // スクロールトップボタンの初期化
    initializeScrollTop();

    // 商品カードクリックの初期化
    initializeProductCards();

    // カート数の更新
    updateCartCount();
    updateWishlistCount();
}

// ===================================
// Swiper初期化
// ===================================
function initializeSwiper() {
    if (document.querySelector('.hero-swiper')) {
        new Swiper('.hero-swiper', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            speed: 800,
        });
    }
}

// ===================================
// モバイルメニュー
// ===================================
function initializeMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.classList.add('active');
            }
            menuBtn.classList.add('active');
        });
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.classList.remove('active');
            }
            if (menuBtn) {
                menuBtn.classList.remove('active');
            }
        });
    }

    // メニュー外クリックで閉じる
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                if (menuBtn) {
                    menuBtn.classList.remove('active');
                }
            }
        });
    }
}

// ===================================
// 検索機能
// ===================================
function initializeSearch() {
    // PC検索
    const searchInput = document.querySelector('.header-search input');
    const searchButton = document.querySelector('.header-search button');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch(searchInput.value);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(this.value);
            }
        });
    }

    // モバイル検索ボタン
    const searchBtnSp = document.getElementById('searchBtnSp');
    if (searchBtnSp) {
        searchBtnSp.addEventListener('click', function() {
            showMobileSearch();
        });
    }
}

function performSearch(query) {
    if (!query || query.trim() === '') {
        alert('検索キーワードを入力してください');
        return;
    }

    // 実際の実装では検索結果ページへ遷移
    console.log('検索実行:', query);
    alert(`「${query}」で検索します\n（実装時は検索結果ページへ遷移します）`);

    // 検索履歴を保存
    saveSearchHistory(query);
}

function showMobileSearch() {
    const searchQuery = prompt('検索キーワードを入力してください');
    if (searchQuery) {
        performSearch(searchQuery);
    }
}

function saveSearchHistory(query) {
    let history = JSON.parse(localStorage.getItem('goemonsearchhistory')) || [];

    // 重複を削除
    history = history.filter(item => item !== query);

    // 先頭に追加
    history.unshift(query);

    // 最大10件まで保存
    if (history.length > 10) {
        history = history.slice(0, 10);
    }

    localStorage.setItem('goemonsearchhistory', JSON.stringify(history));
}

// ===================================
// お気に入り機能
// ===================================
function initializeWishlist() {
    const wishlistBtns = document.querySelectorAll('.btn-wishlist');

    wishlistBtns.forEach(btn => {
        const productCard = btn.closest('.product-card');
        const productId = productCard ? productCard.dataset.productId : null;

        // ローカルストレージから状態を復元
        if (productId && wishlist.includes(productId)) {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!productId) return;

            toggleWishlist(productId, btn);
        });
    });
}

function toggleWishlist(productId, btn) {
    const icon = btn.querySelector('i');

    if (wishlist.includes(productId)) {
        // お気に入りから削除
        wishlist = wishlist.filter(id => id !== productId);
        btn.classList.remove('active');
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    } else {
        // お気に入りに追加
        wishlist.push(productId);
        btn.classList.add('active');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
    }

    // ローカルストレージに保存
    localStorage.setItem('goemonwishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

function updateWishlistCount() {
    const countElements = document.querySelectorAll('.header-utility a[href*="favorites"] .txt-noti');
    countElements.forEach(el => {
        el.textContent = wishlist.length;
        el.style.display = wishlist.length > 0 ? 'flex' : 'none';
    });
}

// ===================================
// カート機能
// ===================================
async function updateCartCount() {
    const countElements = document.querySelectorAll('.header-utility a[href*="cart"] .txt-noti');

    try {
        // 認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();

        let totalItems = 0;

        if (session?.user) {
            // ログインユーザー: Supabaseから取得
            const userId = session.user.id;
            const cartItems = await fetchCartItems(userId);
            totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        } else {
            // ゲストユーザー: localStorageから取得
            const localCart = JSON.parse(localStorage.getItem('goemoncart')) || [];
            totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
        }

        countElements.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    } catch (error) {
        console.error('カート数更新エラー:', error);
        // エラー時はlocalStorageから取得
        const localCart = JSON.parse(localStorage.getItem('goemoncart')) || [];
        const totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);

        countElements.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }
}

// ===================================
// モーダル機能
// ===================================
function initializeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addToCartModal');
    const closeBtn = modal ? modal.querySelector('.modal-close') : null;
    const continueBtn = modal ? modal.querySelector('.modal-continue-shopping') : null;

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
}

function showModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addToCartModal');

    if (modalOverlay) modalOverlay.classList.add('active');
    if (modal) modal.classList.add('active');
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('addToCartModal');

    if (modalOverlay) modalOverlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
}

// ===================================
// スクロールトップボタン
// ===================================
function initializeScrollTop() {
    const scrollBtn = document.getElementById('scrollToTop');

    if (!scrollBtn) return;

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// 商品カード機能
// ===================================
function initializeProductCards() {
    // カートに追加ボタン
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = this.dataset.id;
            const productCard = this.closest('.product-card');

            if (productCard) {
                const productName = productCard.querySelector('.product-name')?.textContent || '商品';
                const priceElement = productCard.querySelector('.price-current');
                const priceText = priceElement?.textContent.replace('¥', '').replace(',', '') || '0';
                const price = parseInt(priceText);

                await addToCart({
                    id: productId,
                    name: productName,
                    price: price,
                    quantity: 1,
                    color: 'ホワイト', // デフォルト
                    size: 'M' // デフォルト
                });

                showModal();
                updateModalContent(productName, price);
            }
        });
    });

    // 商品カードクリックで詳細へ
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card');

        if (productCard &&
            !e.target.closest('.btn-wishlist') &&
            !e.target.closest('.add-to-cart-btn') &&
            !e.target.closest('button')) {
            const productId = productCard.dataset.productId;
            console.log('商品詳細へ遷移:', productId);
            // 実装時: window.location.href = `/product/${productId}`;
            alert('商品詳細ページ（実装時に遷移します）\n商品ID: ' + productId);
        }
    });
}

// カートに追加
async function addToCart(product) {
    try {
        // Supabaseで認証状態をチェック
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // 認証ユーザー: Supabaseに追加
            const userId = session.user.id;

            // 既存のカートアイテムを取得
            const cartItems = await fetchCartItems(userId);

            // 同じ商品・色・サイズのアイテムを探す
            const existingItem = cartItems.find(item =>
                item.product_id == product.id &&
                (item.color || '') === (product.color || '') &&
                (item.size || '') === (product.size || '')
            );

            if (existingItem) {
                // 既存アイテムの数量を更新
                const newQuantity = existingItem.quantity + 1;
                await updateCartItemQuantity(existingItem.id, newQuantity);
                console.log('カート数量を更新:', existingItem.id, newQuantity);
            } else {
                // 新しいアイテムを追加
                await window.addToCart(userId, {
                    productId: product.id,
                    quantity: 1,
                    color: product.color,
                    size: product.size
                });
                console.log('カートに新規追加:', product);
            }

            // ローカルのcart配列も更新（カートカウント表示用）
            const localExisting = cart.find(item =>
                item.id === product.id &&
                item.color === product.color &&
                item.size === product.size
            );

            if (localExisting) {
                localExisting.quantity += 1;
            } else {
                cart.push(product);
            }
        } else {
            // ゲストユーザー: localStorageに追加
            const existingItem = cart.find(item =>
                item.id === product.id &&
                item.color === product.color &&
                item.size === product.size
            );

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(product);
            }

            localStorage.setItem('goemoncart', JSON.stringify(cart));
        }

        updateCartCount();
    } catch (error) {
        console.error('カート追加エラー:', error);
        // エラー時はlocalStorageにフォールバック
        const existingItem = cart.find(item =>
            item.id === product.id &&
            item.color === product.color &&
            item.size === product.size
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }

        localStorage.setItem('goemoncart', JSON.stringify(cart));
        updateCartCount();
    }
}

// モーダルの商品情報を更新
function updateModalContent(productName, price) {
    const modal = document.getElementById('addToCartModal');
    if (!modal) return;

    const nameElement = modal.querySelector('.modal-product-name');
    const priceElement = modal.querySelector('.modal-product-price');

    if (nameElement) nameElement.textContent = productName;
    if (priceElement) priceElement.textContent = formatPrice(price);
}

// ===================================
// ユーティリティ関数
// ===================================
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}

function showNotification(message) {
    // 通知表示（簡易版）
    alert(message);
}
