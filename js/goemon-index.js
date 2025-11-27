// 五右衛門 ECサイト - トップページ JavaScript

// グローバル変数
let allProducts = {};

// URLマッピングヘルパー関数
function getCategoryUrl(slug) {
    const categoryMap = {
        'outer': '/outer',
        'tops': '/tops',
        'bottoms': '/bottoms',
        'onepiece': '/onepiece',
        'accessories': '/accessories',
        'shoes': '/shoes',
        'bags': '/bags',
        'krcosmetics': '/krcosmetics',
        'アウター': '/outer',
        'トップス': '/tops',
        'ボトムス': '/bottoms',
        'ワンピース': '/onepiece',
        '小物': '/accessories',
        'シューズ': '/shoes',
        'バッグ': '/bags',
        '韓国コスメ': '/krcosmetics'
    };
    return categoryMap[slug] || `/outer`;
}

function getTypeUrl(slug) {
    const typeMap = {
        'new': '/new',
        'ranking': '/ranking',
        'limited': '/limited',
        'sale': '/sale',
        'new-arrivals': '/new',
        '新着': '/new',
        'ランキング': '/ranking',
        '期間限定': '/limited',
        'セール': '/sale'
    };
    return typeMap[slug] || `/new`;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeIndexPage();
});

async function initializeIndexPage() {
    try {
        // 商品データをSupabaseから読み込み
        console.log('🔄 Fetching products from Supabase...');
        const products = await fetchPublishedProducts();
        console.log('📦 Received products:', products ? products.length : 0);

        if (products && products.length > 0) {
            allProducts = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            console.log('✅ Loaded products from Supabase:', Object.keys(allProducts).length);

            // 商品タイプの分布を表示
            const typeCount = {};
            products.forEach(p => {
                const type = p.productType || 'undefined';
                typeCount[type] = (typeCount[type] || 0) + 1;
            });
            console.log('📊 Products by type:', typeCount);
        } else {
            console.warn('⚠️ No products received from Supabase');
            allProducts = {};
        }
    } catch (error) {
        console.error('❌ Error loading products from Supabase:', error);
        allProducts = {};
    }

    // ヒーロー画像、カテゴリ、商品タイプを読み込み
    await loadCategories();
    await loadProductTypes();

    // Swiperの初期化を待ってからヒーロー画像を読み込み
    if (typeof Swiper !== 'undefined') {
        await loadHeroImages();
    } else {
        console.error('Swiper library not loaded');
    }

    // 商品タイプ別のセクションを動的に生成
    await loadProductTypeSections();
}

// ヒーロー画像をSupabaseから読み込んで表示
async function loadHeroImages() {
    try {
        const heroImages = await fetchActiveHeroImages();

        if (!heroImages || heroImages.length === 0) {
            console.log('Hero images array is empty, using HTML default slides');
            initializeDefaultSwiper();
            return;
        }

        console.log('Loading hero images from Supabase:', heroImages.length);

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
            const link = image.linkUrl || '/new';

            slide.innerHTML = `
                <a href="${link}" class="hero-slide-link">
                    <div class="hero-slide" style="background-image: url('${image.imageUrl}'); background-size: cover; background-position: center;">
                    </div>
                </a>
            `;

            swiperWrapper.appendChild(slide);
            console.log(`Added slide ${index + 1}:`, image.imageUrl);
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

// カテゴリをSupabaseから読み込んで表示
async function loadCategories() {
    try {
        const categories = await fetchCategories();
        if (!categories || categories.length === 0) {
            console.log('Categories array is empty');
            return;
        }

        // 並び順でソート
        categories.sort((a, b) => a.display_order - b.display_order);

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
            const categorySlug = getCategoryUrl(category.slug || category.name);
            li.innerHTML = `<a href="${categorySlug}">${category.name}</a>`;
            categoryList.appendChild(li);
        });

        console.log('Categories loaded:', categories.length);

        // カテゴリを表示
        showCategorySection();

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// 商品タイプをSupabaseから読み込んで表示
async function loadProductTypes() {
    try {
        const productTypes = await fetchProductTypes();
        if (!productTypes || productTypes.length === 0) {
            console.log('Product types array is empty');
            return;
        }

        // 並び順でソート
        productTypes.sort((a, b) => a.display_order - b.display_order);

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
            const typeUrl = getTypeUrl(type.slug || type.name);
            li.innerHTML = `<a href="${typeUrl}">${type.name}</a>`;
            productTypeList.appendChild(li);
        });

        console.log('Product types loaded:', productTypes.length);

    } catch (error) {
        console.error('Error loading product types:', error);
    }
}

// 商品タイプ別のセクションを動的に生成
async function loadProductTypeSections() {
    try {
        // 商品タイプをSupabaseから取得
        const productTypes = await fetchProductTypes();
        if (!productTypes || productTypes.length === 0) {
            console.log('No product types found, loading default sections');
            loadNewArrivals();
            loadRanking();
            loadSaleItems();
            return;
        }

        // 表示順でソート
        productTypes.sort((a, b) => a.display_order - b.display_order);

        // 上から2つの商品タイプのみを使用
        const topThreeTypes = productTypes.slice(0, 2);

        // メインコンテンツエリアを取得
        const mainContent = document.querySelector('.contents-main');
        if (!mainContent) {
            console.error('Main content area not found');
            return;
        }

        // Instagram セクションを保存（最後に再追加するため）
        const instagramSection = document.querySelector('.box-instagram');

        // 既存の商品セクションをクリア
        const oldSections = mainContent.querySelectorAll('.box-category-discount, .box-category-ranking, .box-category-sale');
        oldSections.forEach(section => section.remove());

        // 上から2つの商品タイプのセクションを生成
        topThreeTypes.forEach((type, index) => {
            const section = createProductTypeSection(type, index);

            // Instagramセクションの前に挿入
            if (instagramSection) {
                mainContent.insertBefore(section, instagramSection);
            } else {
                mainContent.appendChild(section);
            }
        });

        // ランキングセクションを固定で追加
        const rankingSection = createRankingSection();
        if (instagramSection) {
            mainContent.insertBefore(rankingSection, instagramSection);
        } else {
            mainContent.appendChild(rankingSection);
        }

        console.log('Product type sections loaded:', topThreeTypes.length, 'of', productTypes.length);
    } catch (error) {
        console.error('Error loading product type sections:', error);
        // エラー時はデフォルトのセクションを読み込み
        loadNewArrivals();
        loadRanking();
        loadSaleItems();
    }
}

// 商品タイプのセクションを生成
function createProductTypeSection(productType, index) {
    const section = document.createElement('section');

    // セクションのクラスを割り当て（スタイリングのため）
    const sectionClasses = ['box-category-discount', 'box-category-ranking', 'box-category-sale'];
    section.className = sectionClasses[index % sectionClasses.length];

    // タイトルとサブタイトルを設定（説明がタイトル、名前がサブタイトル）
    const mainTitle = productType.description || productType.name;
    const subTitle = productType.description ? productType.name : '';

    section.innerHTML = `
        <div class="section-header-top">
            <h2 class="section-title-top section-title-top-en">${mainTitle}</h2>
            ${subTitle ? `<p class="section-subtitle-top">${subTitle}</p>` : ''}
        </div>
        <div class="list-products-01" data-product-type="${productType.name}">
            <!-- 商品カード（自動生成） -->
        </div>
        <div class="view-all-wrapper">
            <a href="${getTypeUrl(productType.slug || productType.name)}" class="view-all-link">すべて見る <i class="fas fa-chevron-right"></i></a>
        </div>
    `;

    // 商品を読み込んで表示
    loadProductsForType(productType.name, section);

    return section;
}

// 特定の商品タイプの商品を読み込み
function loadProductsForType(typeName, sectionElement) {
    const container = sectionElement.querySelector('.list-products-01');
    if (!container) return;

    // 全商品を配列に変換
    const productsArray = Object.values(allProducts);
    console.log('📦 Total products available:', productsArray.length);
    console.log('🔍 Looking for products with productType:', typeName);

    // デバッグ: 商品タイプの分布を確認
    const typeDistribution = {};
    productsArray.forEach(p => {
        const type = p.productType || 'null';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });
    console.log('📊 Product type distribution:', typeDistribution);

    // 指定された商品タイプかつ公開中の商品のみフィルタリング
    const typeProducts = productsArray.filter(product =>
        product.productType === typeName && product.isPublished !== false
    );
    console.log(`✅ Found ${typeProducts.length} products for type "${typeName}"`);

    // 作成日時の降順（新しい順）にソート
    typeProducts.sort((a, b) => {
        const createdAtA = new Date(a.createdAt || 0).getTime();
        const createdAtB = new Date(b.createdAt || 0).getTime();
        if (createdAtB !== createdAtA) {
            return createdAtB - createdAtA;
        }
        // 作成日時が同じ場合はIDで降順
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
    });

    // 上位5件を表示
    typeProducts.slice(0, 5).forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });

    console.log(`Loaded ${typeProducts.length} products for type: ${typeName}`);
}

/**
 * ランキングセクションを生成
 */
function createRankingSection() {
    const section = document.createElement('section');
    section.className = 'box-category-ranking';

    section.innerHTML = `
        <div class="section-header-top">
            <h2 class="section-title-top section-title-top-en">RANKING</h2>
            <p class="section-subtitle-top">売れ筋アイテム</p>
        </div>
        <div class="list-products-01" id="rankingProducts">
            <!-- ランキング商品（自動生成） -->
        </div>
        <div class="view-all-wrapper">
            <a href="/ranking" class="view-all-link">すべて見る <i class="fas fa-chevron-right"></i></a>
        </div>
    `;

    // ランキング商品を読み込んで表示
    loadRankingIntoSection(section);

    return section;
}

/**
 * セクションにランキング商品を読み込み
 */
function loadRankingIntoSection(sectionElement) {
    const container = sectionElement.querySelector('.list-products-01');
    if (!container) return;

    // 全商品を配列に変換（公開中のみ）
    const productsArray = Object.values(allProducts).filter(p => p.isPublished !== false);

    // 手動設定の商品と自動の商品を分離
    const manualRankingProducts = productsArray.filter(p => p.showInRanking && p.rankingPosition);
    const autoRankingProducts = productsArray.filter(p => !p.showInRanking || !p.rankingPosition);

    // 手動設定商品を順位でソート
    manualRankingProducts.sort((a, b) => {
        const posA = a.rankingPosition || 999;
        const posB = b.rankingPosition || 999;
        return posA - posB;
    });

    // 自動商品を閲覧数順でソート（閲覧数が同じ場合はIDの降順）
    autoRankingProducts.sort((a, b) => {
        const viewCountA = a.viewCount || 0;
        const viewCountB = b.viewCount || 0;
        if (viewCountB !== viewCountA) {
            return viewCountB - viewCountA; // 閲覧数降順
        }
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA; // ID降順（新しい順）
    });

    // ランキング配列を構築（上位5件のみ表示）
    const rankingProducts = [];
    const maxRanking = 5;

    // 1-5の順位を埋める
    for (let position = 1; position <= maxRanking; position++) {
        // この順位に手動設定された商品があるか確認
        const manualProduct = manualRankingProducts.find(p => p.rankingPosition === position);

        if (manualProduct) {
            rankingProducts.push(manualProduct);
        } else {
            // 手動設定がない場合、自動商品から追加
            if (autoRankingProducts.length > 0) {
                rankingProducts.push(autoRankingProducts.shift());
            }
        }
    }

    // ランキングを表示
    rankingProducts.forEach((product, index) => {
        product.rank = index + 1;
        const card = createProductCard(product);
        container.appendChild(card);
    });

    console.log('Ranking section loaded:', rankingProducts.length, 'products');
}

// 新着商品を読み込み（フォールバック用）
function loadNewArrivals() {
    const container = document.querySelector('.box-category-discount .list-products-01');
    const viewAllButton = document.querySelector('.box-category-discount .view-all-link');

    if (!container) {
        console.error('New arrivals container not found');
        return;
    }

    // 全商品を配列に変換
    const productsArray = Object.values(allProducts);

    // 商品タイプが「new-arrivals」かつ公開中の商品のみフィルタリング
    const newArrivalsProducts = productsArray.filter(product =>
        product.productType === 'new-arrivals' && product.isPublished !== false
    );

    // publishedAtの降順（新しい順）にソート、publishedAtがない場合はIDで降順
    newArrivalsProducts.sort((a, b) => {
        const publishedAtA = a.publishedAt || 0;
        const publishedAtB = b.publishedAt || 0;
        if (publishedAtB !== publishedAtA) {
            return publishedAtB - publishedAtA;
        }
        // publishedAtが同じ場合はIDで降順
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
    });

    // 最新10件を表示
    newArrivalsProducts.slice(0, 10).forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });

    // 「すべて見る」ボタンを商品タイプでフィルタリングするように更新
    if (viewAllButton) {
        viewAllButton.href = '/new';
    }

    console.log('New arrivals loaded:', newArrivalsProducts.length);
}

// ランキング商品を読み込み
function loadRanking() {
    const container = document.querySelector('.box-category-ranking .list-products-01');
    if (!container) return;

    // 全商品を配列に変換（公開中のみ）
    const productsArray = Object.values(allProducts).filter(p => p.isPublished !== false);

    // 手動設定の商品と自動の商品を分離
    const manualRankingProducts = productsArray.filter(p => p.showInRanking && p.rankingPosition);
    const autoRankingProducts = productsArray.filter(p => !p.showInRanking || !p.rankingPosition);

    // 手動設定商品を順位でソート
    manualRankingProducts.sort((a, b) => {
        const posA = a.rankingPosition || 999;
        const posB = b.rankingPosition || 999;
        return posA - posB;
    });

    // 自動商品を閲覧数順でソート（閲覧数が同じ場合はIDの降順）
    autoRankingProducts.sort((a, b) => {
        const viewCountA = a.viewCount || 0;
        const viewCountB = b.viewCount || 0;
        if (viewCountB !== viewCountA) {
            return viewCountB - viewCountA; // 閲覧数降順
        }
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA; // ID降順（新しい順）
    });

    // ランキング配列を構築（最大10件）
    const rankingProducts = [];
    const maxRanking = 10;

    // 1-10の順位を埋める
    for (let position = 1; position <= maxRanking; position++) {
        // この順位に手動設定された商品があるか確認
        const manualProduct = manualRankingProducts.find(p => p.rankingPosition === position);

        if (manualProduct) {
            rankingProducts.push(manualProduct);
        } else {
            // 手動設定がない場合、自動商品から追加
            if (autoRankingProducts.length > 0) {
                rankingProducts.push(autoRankingProducts.shift());
            }
        }
    }

    // ランキングを表示
    rankingProducts.forEach((product, index) => {
        product.rank = index + 1;
        const card = createProductCard(product);
        container.appendChild(card);
    });

    console.log('Ranking loaded:', rankingProducts.length, 'products');
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
        window.location.href = `/product/${product.id}`;
    });

    return card;
}


// セール商品を読み込み
function loadSaleItems() {
    const container = document.getElementById('saleProducts');
    const viewAllButton = document.querySelector('.box-category-sale .view-all-link');

    if (!container) return;

    // 全商品を配列に変換
    const productsArray = Object.values(allProducts);

    // 商品タイプが「sale」かつ公開中の商品のみフィルタリング
    const saleProducts = productsArray.filter(product =>
        product.productType === 'sale' && product.isPublished !== false
    );

    // publishedAtの降順（新しい順）にソート、publishedAtがない場合はIDで降順
    saleProducts.sort((a, b) => {
        const publishedAtA = a.publishedAt || 0;
        const publishedAtB = b.publishedAt || 0;
        if (publishedAtB !== publishedAtA) {
            return publishedAtB - publishedAtA;
        }
        // publishedAtが同じ場合はIDで降順
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
    });

    // 最新10件を表示
    saleProducts.slice(0, 10).forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });

    // 「すべて見る」ボタンを商品タイプでフィルタリングするように更新
    if (viewAllButton) {
        viewAllButton.href = '/sale';
    }

    console.log('Sale items loaded:', saleProducts.length);
}

// 価格フォーマット
function formatPrice(price) {
    return '¥' + price.toLocaleString();
}
