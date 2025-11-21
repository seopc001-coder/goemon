// 五右衛門 ECサイト - お気に入りページ JavaScript
(function() {
    'use strict';

    // グローバル変数（スコープ内）
    let favoritesPageWishlist = [];
    let currentUser = null;
    let productsData = {};

    // 商品データを初期化
    async function initializeProductsData() {
        try {
            const products = await fetchPublishedProducts();
            productsData = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            console.log('Loaded products from Supabase:', Object.keys(productsData).length);
        } catch (error) {
            console.error('Error loading products from Supabase:', error);
            productsData = {};
        }
    }

    document.addEventListener('DOMContentLoaded', async function() {
        try {
            // 商品データを初期化
            await initializeProductsData();

            // UI機能を初期化
            initializeMobileMenu();
            initializeScrollTop();
            updateCartCount();

            // ログイン状態を確認してお気に入りを読み込み
            await loadFavorites();

            // お気に入りを表示
            renderFavoritesList();

        } catch (error) {
            console.error('Error in initializeFavoritesPage:', error);
            // エラーが発生しても空の状態を表示
            const container = document.getElementById('favoritesContainer');
            const emptyState = document.getElementById('emptyFavorites');
            if (container) container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
        }
    });

    // お気に入りを読み込み（Supabaseから）
    async function loadFavorites() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // ログインしていない場合はlocalStorageから読み込み
                favoritesPageWishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
                console.log('Not logged in, using localStorage:', favoritesPageWishlist);
                return;
            }

            currentUser = user;

            // Supabaseからお気に入りを取得
            const data = await fetchFavorites(user.id);

            // 商品IDの配列に変換
            favoritesPageWishlist = data.map(item => item.product_id);
            console.log('Loaded favorites from Supabase:', favoritesPageWishlist);

            // localStorageも更新
            localStorage.setItem('goemonwishlist', JSON.stringify(favoritesPageWishlist));

            // ヘッダーのお気に入り件数を更新
            updateFavoritesHeaderCount();

        } catch (error) {
            console.error('Error in loadFavorites:', error);
            favoritesPageWishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
        }
    }

    // ヘッダーのお気に入り件数を更新
    function updateFavoritesHeaderCount() {
        const countElements = document.querySelectorAll('.header-utility a[href*="favorites"] .txt-noti');
        countElements.forEach(el => {
            el.textContent = favoritesPageWishlist.length;
            el.style.display = favoritesPageWishlist.length > 0 ? 'flex' : 'none';
        });
    }

    // お気に入りリストを描画
    function renderFavoritesList() {
        const container = document.getElementById('favoritesContainer');
        const emptyState = document.getElementById('emptyFavorites');

        if (!container || !emptyState) {
            console.error('Container or emptyState element not found');
            return;
        }

        console.log('Rendering favorites:', favoritesPageWishlist.length, 'items');

        if (favoritesPageWishlist.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        container.innerHTML = '';

        let displayedCount = 0;
        favoritesPageWishlist.forEach(productId => {
            const product = productsData[productId];

            if (!product) {
                console.warn(`Product ${productId} not found in products data`);
                return;
            }

            const productCard = createProductCard(product);
            container.appendChild(productCard);
            displayedCount++;
        });

        console.log(`Displayed ${displayedCount} products out of ${favoritesPageWishlist.length} favorites`);
    }

    // 商品カードを生成
    function createProductCard(product) {
        const card = document.createElement('article');
        card.className = 'card-product-01';
        card.dataset.productId = product.id;

        const hasDiscount = product.originalPrice && product.originalPrice > product.price;

        // 割引率を計算
        let discountPercent = '';
        if (hasDiscount) {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            discountPercent = `${discount}%OFF`;
        }

        // 在庫チェック
        const isSoldOut = product.stock === 0;

        card.innerHTML = `
            <div class="product-image">
                <div class="product-img-wrapper">
                    <div class="product-placeholder">
                        <i class="fas fa-tshirt fa-3x"></i>
                    </div>
                    ${isSoldOut ? `<div class="sold-out-badge">売り切れ</div>` : ''}
                </div>
                <button class="btn-wishlist active" data-product-id="${product.id}" aria-label="お気に入りから削除">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="price-current">¥${product.price.toLocaleString()}</span>
                    ${hasDiscount ? `<span class="price-original">¥${product.originalPrice.toLocaleString()}</span>` : ''}
                    ${hasDiscount ? `<span class="price-discount">${discountPercent}</span>` : ''}
                </div>
            </div>
        `;

        // ハートボタンのクリックイベント
        const wishlistBtn = card.querySelector('.btn-wishlist');
        wishlistBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeFavorite(product.id);
        });

        // 商品カードクリック（ハートボタン以外）
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.btn-wishlist')) {
                window.location.href = `goemon-product.html?id=${product.id}`;
            }
        });

        return card;
    }

    // お気に入りから削除
    async function removeFavorite(productId) {
        try {
            // 配列から削除
            favoritesPageWishlist = favoritesPageWishlist.filter(id => id !== productId);

            // localStorageを更新
            localStorage.setItem('goemonwishlist', JSON.stringify(favoritesPageWishlist));

            // ログインしている場合はSupabaseも更新
            if (currentUser) {
                await removeFromFavoritesByProductId(currentUser.id, productId);
            }

            // ヘッダーのお気に入り件数を更新
            updateFavoritesHeaderCount();

            // リストを再描画
            renderFavoritesList();

        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    }

    // ===================================
    // UI機能
    // ===================================

    // モバイルメニュー
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

    // スクロールトップボタン
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

    // カート数の更新
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('goemoncart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        const countElements = document.querySelectorAll('.header-utility a[href*="cart"] .txt-noti');
        countElements.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

})();
