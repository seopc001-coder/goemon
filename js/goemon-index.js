// 五右衛門 ECサイト - トップページ JavaScript

// グローバル変数
let allProducts = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeIndexPage();
});

function initializeIndexPage() {
    // 商品データを初期化
    if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
        allProducts = window.GOEMON_PRODUCTS.generateProductsData(100);
    }

    // ヒーロー画像とカテゴリを読み込み（優先順位を変更）
    loadCategories();

    // Swiperの初期化を待ってからヒーロー画像を読み込み
    if (typeof Swiper !== 'undefined') {
        loadHeroImages();
    } else {
        console.error('Swiper library not loaded');
    }

    loadNewArrivals();
    loadRanking();
    loadSaleItems();
}

// ヒーロー画像をlocalStorageから読み込んで表示
function loadHeroImages() {
    try {
        const savedHeroImages = localStorage.getItem('goemonheroimages');

        // localStorageにデータがない場合は、HTMLのデフォルトスライドを使用
        if (!savedHeroImages) {
            console.log('No saved hero images, using HTML default slides');
            initializeDefaultSwiper();
            return;
        }

        const heroImages = JSON.parse(savedHeroImages);
        if (!heroImages || heroImages.length === 0) {
            console.log('Hero images array is empty, using HTML default slides');
            initializeDefaultSwiper();
            return;
        }

        console.log('Loading hero images from localStorage:', heroImages.length);

        // 並び順でソート
        heroImages.sort((a, b) => a.order - b.order);

        // Swiperのwrapperを取得
        const swiperWrapper = document.querySelector('.hero-swiper .swiper-wrapper');
        if (!swiperWrapper) {
            console.error('Swiper wrapper not found');
            initializeDefaultSwiper();
            return;
        }

        // 既存のスライドをクリア
        swiperWrapper.innerHTML = '';

        // ヒーロー画像を動的に生成
        heroImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            const link = image.link || 'goemon-products.html';

            slide.innerHTML = `
                <a href="${link}" class="hero-slide-link">
                    <div class="hero-slide" style="background-image: url('${image.url}'); background-size: cover; background-position: center;">
                        <div class="hero-content">
                            <h2>${image.alt}</h2>
                            <p>${image.title}</p>
                        </div>
                    </div>
                </a>
            `;

            swiperWrapper.appendChild(slide);
            console.log(`Added slide ${index + 1}:`, image.alt);
        });

        // 短い遅延の後にSwiperを初期化
        setTimeout(() => {
            if (window.heroSwiper) {
                window.heroSwiper.destroy(true, true);
            }

            window.heroSwiper = new Swiper('.hero-swiper', {
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                speed: 800,
                effect: 'slide',
            });
            console.log('Swiper initialized with', heroImages.length, 'slides');
        }, 200);

    } catch (error) {
        console.error('Error loading hero images:', error);
        initializeDefaultSwiper();
    }
}

// デフォルトのSwiper初期化（HTMLの既存スライドを使用）
function initializeDefaultSwiper() {
    setTimeout(() => {
        if (!window.heroSwiper) {
            window.heroSwiper = new Swiper('.hero-swiper', {
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                speed: 800,
                effect: 'slide',
            });
            console.log('Default Swiper initialized with HTML slides');
        }
    }, 100);
}

// カテゴリをlocalStorageから読み込んで表示
function loadCategories() {
    try {
        const savedCategories = localStorage.getItem('goemoncategories');
        if (!savedCategories) {
            console.log('No saved categories found');
            return;
        }

        const categories = JSON.parse(savedCategories);
        if (!categories || categories.length === 0) {
            console.log('Categories array is empty');
            return;
        }

        // 並び順でソート
        categories.sort((a, b) => a.order - b.order);

        // カテゴリリストを取得（タイトルが「カテゴリー」のwidgetを探す）
        const widgets = document.querySelectorAll('.sidebar-widget');
        let categoryList = null;

        widgets.forEach(widget => {
            const title = widget.querySelector('.widget-title');
            if (title && title.textContent.includes('カテゴリー')) {
                categoryList = widget.querySelector('.category-list-sidebar');
            }
        });

        if (!categoryList) {
            console.error('Category list not found');
            return;
        }

        // 既存のカテゴリをクリア
        categoryList.innerHTML = '';

        // カテゴリを動的に生成
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="goemon-products.html?category=${category.slug}">${category.name}</a>`;
            categoryList.appendChild(li);
        });

        console.log('Categories loaded:', categories.length);

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// 新着商品を読み込み
function loadNewArrivals() {
    const container = document.querySelector('.box-category-discount .list-products-01');
    if (!container) {
        console.error('New arrivals container not found');
        return;
    }

    // ID 1-10の商品を表示
    const productIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    productIds.forEach(id => {
        const product = allProducts[id];
        if (product) {
            const card = createProductCard(product);
            container.appendChild(card);
        } else {
            console.error(`Product ${id} not found`);
        }
    });
}

// ランキング商品を読み込み
function loadRanking() {
    const container = document.querySelector('.box-category-ranking .list-products-01');
    if (!container) return;

    // ID 11-20の商品を表示
    const productIds = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

    productIds.forEach((id, index) => {
        const product = allProducts[id];
        if (product) {
            product.rank = index + 1;
            const card = createProductCard(product);
            container.appendChild(card);
        }
    });
}

// 商品カードを生成
function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'card-product-01';
    card.dataset.productId = product.id;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const rank = product.rank || null;

    // 割引率を計算
    let discountPercent = '';
    if (hasDiscount) {
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        discountPercent = `${discount}%OFF`;
    }

    card.innerHTML = `
        <div class="product-image">
            <div class="product-img-wrapper">
                <div class="product-placeholder">
                    <i class="fas fa-tshirt fa-3x"></i>
                </div>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            ${rank ? `<div class="txt-ranking">${rank}</div>` : ''}
            <div class="product-price">
                <span class="price-current">¥${product.price.toLocaleString()}</span>
                ${hasDiscount ? `<span class="price-original">¥${product.originalPrice.toLocaleString()}</span>` : ''}
                ${hasDiscount ? `<span class="price-discount">${discountPercent}</span>` : ''}
            </div>
        </div>
    `;

    // 商品カードクリック
    card.addEventListener('click', function() {
        window.location.href = `goemon-product.html?id=${product.id}`;
    });

    return card;
}


// セール商品を読み込み
function loadSaleItems() {
    const container = document.getElementById('saleProducts');
    if (!container) return;

    // ID 31-40の商品を表示
    const productIds = ['31', '32', '33', '34', '35', '36', '37', '38', '39', '40'];

    productIds.forEach(id => {
        const product = allProducts[id];
        if (product) {
            const card = createProductCard(product);
            container.appendChild(card);
        }
    });
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
