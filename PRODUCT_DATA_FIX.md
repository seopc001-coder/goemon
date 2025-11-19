# 商品データ反映問題の修正

## 問題

商品管理画面で編集した内容（画像、商品名、価格、カテゴリなど）がECサイトに反映されない問題がありました。

## 原因

以下の3つのファイルが、localStorageに保存された商品データではなく、デモデータ生成関数から商品を読み込んでいました:

1. **js/goemon-products.js** - 商品一覧ページ
2. **js/goemon-index.js** - トップページ
3. **js/goemon-product.js** - 商品詳細ページ

### 旧コード例（goemon-products.js）
```javascript
function loadProducts() {
    // 共通の商品データを使用
    if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.getProductsArray === 'function') {
        allProducts = window.GOEMON_PRODUCTS.getProductsArray(100);  // ← デモデータ生成
    } else {
        allProducts = [];
    }
    // ...
}
```

この実装では、管理画面で `localStorage.setItem('goemonproducts', ...)` に保存されたデータが使用されず、常にデモデータが表示されていました。

## 修正内容

### 1. js/goemon-products.js の修正

商品一覧ページのデータ読み込みロジックを変更しました。

**変更箇所**: 66-98行目

**新しいロジック**:
```javascript
function loadProducts() {
    // localStorageから商品データを読み込み
    const savedProducts = localStorage.getItem('goemonproducts');

    if (savedProducts) {
        // 保存されている商品データを使用
        try {
            const productsData = JSON.parse(savedProducts);
            // オブジェクト形式の場合は配列に変換
            if (Array.isArray(productsData)) {
                allProducts = productsData;
            } else {
                allProducts = Object.values(productsData);
            }
            console.log('Loaded products from localStorage:', allProducts.length);
        } catch (error) {
            console.error('Error parsing saved products:', error);
            allProducts = [];
        }
    } else {
        // localStorageにデータがない場合は、デモデータを使用
        if (window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.getProductsArray === 'function') {
            allProducts = window.GOEMON_PRODUCTS.getProductsArray(100);
            console.log('Using demo products data');
        } else {
            allProducts = [];
        }
    }
    // ...
}
```

### 2. js/goemon-index.js の修正

トップページのデータ読み込みロジックを変更しました。

**変更箇所**: 10-58行目

**新しいロジック**:
```javascript
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
    // ...
}
```

### 3. js/goemon-product.js の修正

商品詳細ページのデータ読み込みロジックを変更しました。

**変更箇所**:
- 20-52行目（商品データ読み込み）
- 500-542行目（関連商品読み込み）

**新しいロジック**:
```javascript
function loadProductData() {
    const productId = getProductIdFromURL();

    // localStorageから商品データを取得
    const savedProducts = localStorage.getItem('goemonproducts');
    let product = null;

    if (savedProducts) {
        try {
            const productsData = JSON.parse(savedProducts);
            // 配列形式かオブジェクト形式か判定して商品を検索
            if (Array.isArray(productsData)) {
                product = productsData.find(p => p.id === productId);
            } else {
                product = productsData[productId];
            }
            console.log('Loaded product from localStorage:', productId);
        } catch (error) {
            console.error('Error parsing saved products:', error);
        }
    }

    // localStorageにない場合はデモデータから取得
    if (!product && window.GOEMON_PRODUCTS && typeof window.GOEMON_PRODUCTS.getProductById === 'function') {
        product = window.GOEMON_PRODUCTS.getProductById(productId);
        console.log('Using demo product data');
    }

    if (product) {
        productData = product;
        updateProductDisplay();
    }
}
```

## データフォーマット対応

修正では、商品データが以下の2つの形式のいずれでも動作するようにしています:

### 形式1: 配列形式
```javascript
[
    { id: '1', name: '商品A', price: 1000, ... },
    { id: '2', name: '商品B', price: 2000, ... },
    ...
]
```

### 形式2: オブジェクト形式
```javascript
{
    '1': { id: '1', name: '商品A', price: 1000, ... },
    '2': { id: '2', name: '商品B', price: 2000, ... },
    ...
}
```

コードは自動的にどちらの形式かを判定し、適切に処理します。

## フォールバック機能

修正後も、localStorageにデータがない場合は従来通りデモデータを表示するフォールバック機能を保持しています。これにより:

1. **初回訪問時**: デモデータが表示される
2. **商品管理後**: localStorageに保存された実際の商品データが表示される
3. **開発・デバッグ時**: データがない場合でもエラーにならない

## 動作確認方法

### 1. 商品管理画面で編集
1. `goemon-admin-products.html` を開く
2. 既存の商品を編集、または新しい商品を追加
3. 保存する

### 2. ECサイトで確認
以下の3ページで編集内容が反映されることを確認:

1. **トップページ** (`goemon-index.html`)
   - 新着商品セクション
   - ランキングセクション
   - セール商品セクション

2. **商品一覧ページ** (`goemon-products.html`)
   - すべての商品が表示される
   - フィルター機能も正常に動作

3. **商品詳細ページ** (`goemon-product.html`)
   - 商品の詳細情報
   - 関連商品

### 3. ブラウザコンソールでの確認

ブラウザの開発者ツール（F12）でコンソールを開くと、以下のようなログが表示されます:

```
Loaded products from localStorage: 15
```

または、localStorageにデータがない場合:

```
Using demo products data
```

## トラブルシューティング

### 商品データが反映されない場合

1. **ブラウザのキャッシュをクリア**
   - Ctrl + Shift + Delete でブラウザキャッシュをクリア
   - ページをリロード（Ctrl + F5）

2. **localStorageの確認**
   - F12 で開発者ツールを開く
   - Application タブ → Local Storage を選択
   - `goemonproducts` キーが存在するか確認

3. **コンソールログの確認**
   - F12 で開発者ツールを開く
   - Console タブでエラーがないか確認
   - 「Loaded products from localStorage」というメッセージを確認

### データ形式の確認

localStorageのデータ形式を確認するには、ブラウザのコンソールで以下を実行:

```javascript
const data = localStorage.getItem('goemonproducts');
console.log(JSON.parse(data));
```

## まとめ

この修正により、商品管理画面で編集したすべての内容（商品名、価格、カテゴリ、画像、説明文など）がECサイトの全ページに正しく反映されるようになりました。

### 修正されたファイル
1. ✅ js/goemon-products.js（商品一覧ページ）
2. ✅ js/goemon-index.js（トップページ）
3. ✅ js/goemon-product.js（商品詳細ページ）

### 確認済み機能
- ✅ 商品画像の表示
- ✅ 商品名・価格の表示
- ✅ カテゴリ・タイプの表示
- ✅ 商品説明の表示
- ✅ 割引情報の表示
- ✅ すべての商品データフィールドの反映
