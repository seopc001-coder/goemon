// 五右衛門 ECサイト - 共通商品データ
// すべてのページで共通の商品データを使用するための共有ファイル

// 商品データを生成（一貫性のあるデータを生成）
function generateProductsData(count) {
    const products = {};
    const names = [
        'カジュアルコットンブラウス', 'ニットカーディガン', 'フローラルワンピース',
        'ハイウエストデニムパンツ', 'レーストップス', 'オーバーサイズニット',
        'マキシ丈スカート', 'ストライプシャツ', 'ワイドパンツ', 'デニムジャケット'
    ];
    // slugを使用（設定画面のカテゴリと一致）
    const categories = ['outer', 'tops', 'bottoms', 'onepiece', 'shoes', 'bags', 'accessories'];
    const productTypes = ['new-arrivals', 'pre-order', 'restock'];
    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['white', 'black', 'pink', 'blue', 'beige'];

    // シード値を使って一貫性のある乱数を生成
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    for (let i = 0; i < count; i++) {
        // IDをシードとして使用して一貫性のある値を生成
        const priceSeed = i * 1000 + 1;
        const price = Math.floor(seededRandom(priceSeed) * 8000) + 2000;

        const hasOriginalPrice = seededRandom(i * 1000 + 2) > 0.7;
        const originalPrice = hasOriginalPrice ? price + Math.floor(seededRandom(i * 1000 + 3) * 2000) : null;

        products[String(i + 1)] = {
            id: String(i + 1),
            name: names[i % names.length] + (i > 9 ? ` ${Math.floor(i / 10)}` : ''),
            price: price,
            originalPrice: originalPrice,
            category: categories[Math.floor(seededRandom(i * 1000 + 4) * categories.length)],
            productType: productTypes[Math.floor(seededRandom(i * 1000 + 9) * productTypes.length)],
            size: sizes[Math.floor(seededRandom(i * 1000 + 5) * sizes.length)],
            color: colors[Math.floor(seededRandom(i * 1000 + 6) * colors.length)],
            isNew: seededRandom(i * 1000 + 7) > 0.5,
            popularity: Math.floor(seededRandom(i * 1000 + 8) * 1000)
        };
    }

    return products;
}

// 配列形式で商品データを取得
function getProductsArray(count) {
    const productsObj = generateProductsData(count);
    return Object.values(productsObj);
}

// 特定のIDの商品を取得
function getProductById(id) {
    const products = generateProductsData(100);
    return products[String(id)] || null;
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.GOEMON_PRODUCTS = {
        generateProductsData: generateProductsData,
        getProductsArray: getProductsArray,
        getProductById: getProductById
    };
}
