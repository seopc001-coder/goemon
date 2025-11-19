// 五右衛門 ECサイト - トップページ JavaScript

// グローバル変数
let allProducts = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeIndexPage();
});

function initializeIndexPage() {
    // 商品データを初期化
    const savedProducts = localStorage.getItem('goemonproducts');

    if (savedProducts) {
        // 保存されている商品データを使用
        try {
            const productsData = JSON.parse(savedProducts);
            // オブジェクト形式の場合は配列形式に変換
            if (Array.isArray(productsData)) {
                // 配列の場合は、IDをキーとするオブジェクトに変換
                allProducts = {};
                productsData.forEach(product => {
                    allProducts[product.id] = product;
                });
            } else {
                allProducts = productsData;
            }
            console.log('Loaded products from localStorage:', Object.keys(allProducts).length);
        } catch (error) {
            console.error('Error parsing saved products:', error);
            allProducts = {};
        }
    } else {
        // localStorageにデータがない場合は、デモデータを使用
        if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.generateProductsData === 'function') {
            allProducts = window.GOEMON_PRODUCTS.generateProductsData(100);
            console.log('Using demo products data');
        }
    }

    // デフォルトデータを初期化（localStorageにない場合）
    initializeDefaultDataIfNeeded();

    // ヒーロー画像、カテゴリ、商品タイプを読み込み
    loadCategories();
    loadProductTypes();

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

// デフォルトデータを初期化（localStorageにない場合）
function initializeDefaultDataIfNeeded() {
    const categoriesExist = localStorage.getItem('goemoncategories');
    const heroImagesExist = localStorage.getItem('goemonheroimages');
    const productTypesExist = localStorage.getItem('goemonproducttypes');

    if (!categoriesExist) {
        const defaultCategories = [
            { id: 'outer', name: 'アウター', slug: 'outer', description: 'ジャケット、コートなど', order: 0 },
            { id: 'tops', name: 'トップス', slug: 'tops', description: 'シャツ、カットソーなど', order: 1 },
            { id: 'bottoms', name: 'ボトムス', slug: 'bottoms', description: 'パンツ、スカートなど', order: 2 },
            { id: 'onepiece', name: 'ワンピース', slug: 'onepiece', description: 'ワンピース・ドレス', order: 3 },
            { id: 'shoes', name: 'シューズ', slug: 'shoes', description: '靴・スニーカー', order: 4 },
            { id: 'bags', name: 'バッグ', slug: 'bags', description: 'バッグ・小物', order: 5 },
            { id: 'accessories', name: 'アクセサリー', slug: 'accessories', description: 'アクセサリー・小物', order: 6 }
        ];
        localStorage.setItem('goemoncategories', JSON.stringify(defaultCategories));
        console.log('Default categories initialized on index page');
    }

    if (!heroImagesExist) {
        const defaultHeroImages = [
            {
                id: 'hero1',
                url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
                link: 'goemon-products.html',
                alt: '2025 SPRING COLLECTION',
                title: '春の新作コレクション入荷',
                order: 0
            },
            {
                id: 'hero2',
                url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
                link: 'goemon-products.html',
                alt: 'SALE MAX 70% OFF',
                title: '春夏アイテムがお買い得',
                order: 1
            },
            {
                id: 'hero3',
                url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
                link: 'goemon-register.html',
                alt: 'NEW MEMBER CAMPAIGN',
                title: '新規登録で500円クーポン',
                order: 2
            }
        ];
        localStorage.setItem('goemonheroimages', JSON.stringify(defaultHeroImages));
        console.log('Default hero images initialized on index page');
    }

    if (!productTypesExist) {
        const defaultProductTypes = [
            { id: 'new-arrivals', name: '新着アイテム', slug: 'new-arrivals', description: '最新の入荷商品', order: 0 },
            { id: 'pre-order', name: '予約アイテム', slug: 'pre-order', description: '予約受付中の商品', order: 1 },
            { id: 'restock', name: '再入荷', slug: 'restock', description: '人気商品が再入荷', order: 2 }
        ];
        localStorage.setItem('goemonproducttypes', JSON.stringify(defaultProductTypes));
        console.log('Default product types initialized on index page');
    }
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

            // ヒーロー画像を表示
            showHeroSection();
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

            // ヒーロー画像を表示
            showHeroSection();
        }
    }, 100);
}

// ヒーロー画像セクションを表示
function showHeroSection() {
    const heroSection = document.querySelector('.hero-cmn-01');
    if (heroSection) {
        heroSection.style.opacity = '1';
        console.log('Hero section displayed');
    }
}

// カテゴリセクションを表示
function showCategorySection() {
    const widgets = document.querySelectorAll('.sidebar-widget');
    widgets.forEach(widget => {
        const title = widget.querySelector('.widget-title');
        if (title && title.textContent.includes('カテゴリー')) {
            widget.style.opacity = '1';
            console.log('Category section displayed');
        }
    });
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

        // カテゴリを表示
        showCategorySection();

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// 商品タイプをlocalStorageから読み込んで表示
function loadProductTypes() {
    try {
        const savedProductTypes = localStorage.getItem('goemonproducttypes');
        if (!savedProductTypes) {
            console.log('No saved product types found');
            return;
        }

        const productTypes = JSON.parse(savedProductTypes);
        if (!productTypes || productTypes.length === 0) {
            console.log('Product types array is empty');
            return;
        }

        // 並び順でソート
        productTypes.sort((a, b) => a.order - b.order);

        // 商品タイプリストを取得（タイトルが「商品タイプから探す」のwidgetを探す）
        const widgets = document.querySelectorAll('.sidebar-widget');
        let productTypeList = null;

        widgets.forEach(widget => {
            const title = widget.querySelector('.widget-title');
            if (title && title.textContent.includes('商品タイプから探す')) {
                productTypeList = widget.querySelector('.category-list-sidebar');
            }
        });

        if (!productTypeList) {
            console.error('Product type list not found');
            return;
        }

        // 既存の商品タイプをクリア
        productTypeList.innerHTML = '';

        // 商品タイプを動的に生成
        productTypes.forEach(type => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="goemon-products.html?type=${type.slug}">${type.name}</a>`;
            productTypeList.appendChild(li);
        });

        console.log('Product types loaded:', productTypes.length);

    } catch (error) {
        console.error('Error loading product types:', error);
    }
}

// 新着商品を読み込み
function loadNewArrivals() {
    const container = document.querySelector('.box-category-discount .list-products-01');
    if (!container) {
        console.error('New arrivals container not found');
        return;
    }

    // 全商品を配列に変換してIDの降順（新しい順）にソート
    const productsArray = Object.values(allProducts);
    productsArray.sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA; // 降順（新しい順）
    });

    // 最新10件を表示
    productsArray.slice(0, 10).forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// ランキング商品を読み込み
function loadRanking() {
    const container = document.querySelector('.box-category-ranking .list-products-01');
    if (!container) return;

    // 全商品を配列に変換してIDの降順（新しい順）にソート
    const productsArray = Object.values(allProducts);
    productsArray.sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA; // 降順（新しい順）
    });

    // 11件目から20件目を表示（新着の次に新しい商品）
    productsArray.slice(10, 20).forEach((product, index) => {
        product.rank = index + 1;
        const card = createProductCard(product);
        container.appendChild(card);
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

    // 画像URLを確認
    const imageUrl = product.image || '';

    card.innerHTML = `
        <div class="product-image">
            <div class="product-img-wrapper">
                ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `
                <div class="product-placeholder">
                    <i class="fas fa-tshirt fa-3x"></i>
                </div>
                `}
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

    // 全商品を配列に変換してIDの降順（新しい順）にソート
    const productsArray = Object.values(allProducts);
    productsArray.sort((a, b) => {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA; // 降順（新しい順）
    });

    // 21件目から30件目を表示（ランキングの次に新しい商品）
    productsArray.slice(20, 30).forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
