// ===================================
// 五右衛門 ECサイト - 商品バリエーション管理
// ===================================

// バリエーションデータを保持
let productColors = [];
let productSizes = [];
let variantsStock = {}; // { "レッド-M": 10, "レッド-L": 5, ... }

/**
 * 色を追加
 */
function addColor() {
    const input = document.getElementById('newColorInput');
    const colorName = input.value.trim();

    if (!colorName) {
        showAlertModal('色の名前を入力してください', 'warning');
        return;
    }

    if (productColors.includes(colorName)) {
        showAlertModal('この色はすでに追加されています', 'warning');
        return;
    }

    productColors.push(colorName);
    input.value = '';
    renderColorsList();
    updateVariantsStockTable();
}

/**
 * 色を削除
 */
function removeColor(colorName) {
    productColors = productColors.filter(c => c !== colorName);

    // この色に関連する在庫データを削除
    Object.keys(variantsStock).forEach(key => {
        if (key.startsWith(colorName + '-')) {
            delete variantsStock[key];
        }
    });

    renderColorsList();
    updateVariantsStockTable();
}

/**
 * サイズを追加
 */
function addSize() {
    const input = document.getElementById('newSizeInput');
    const sizeName = input.value.trim();

    if (!sizeName) {
        showAlertModal('サイズの名前を入力してください', 'warning');
        return;
    }

    if (productSizes.includes(sizeName)) {
        showAlertModal('このサイズはすでに追加されています', 'warning');
        return;
    }

    productSizes.push(sizeName);
    input.value = '';
    renderSizesList();
    updateVariantsStockTable();
}

/**
 * サイズを削除
 */
function removeSize(sizeName) {
    productSizes = productSizes.filter(s => s !== sizeName);

    // このサイズに関連する在庫データを削除
    Object.keys(variantsStock).forEach(key => {
        if (key.endsWith('-' + sizeName)) {
            delete variantsStock[key];
        }
    });

    renderSizesList();
    updateVariantsStockTable();
}

/**
 * 色リストを表示
 */
function renderColorsList() {
    const container = document.getElementById('colorsList');
    if (!container) return;

    if (productColors.length === 0) {
        container.innerHTML = '<span style="color: #999; font-size: 13px;">色が追加されていません</span>';
        return;
    }

    container.innerHTML = productColors.map(color => `
        <div style="display: inline-flex; align-items: center; gap: 6px; background: white; border: 1px solid #ddd; border-radius: 20px; padding: 6px 12px; font-size: 13px;">
            <span>${color}</span>
            <button type="button" onclick="removeColor('${color}')" style="background: none; border: none; color: #999; cursor: pointer; padding: 0; font-size: 14px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

/**
 * サイズリストを表示
 */
function renderSizesList() {
    const container = document.getElementById('sizesList');
    if (!container) return;

    if (productSizes.length === 0) {
        container.innerHTML = '<span style="color: #999; font-size: 13px;">サイズが追加されていません</span>';
        return;
    }

    container.innerHTML = productSizes.map(size => `
        <div style="display: inline-flex; align-items: center; gap: 6px; background: white; border: 1px solid #ddd; border-radius: 20px; padding: 6px 12px; font-size: 13px;">
            <span>${size}</span>
            <button type="button" onclick="removeSize('${size}')" style="background: none; border: none; color: #999; cursor: pointer; padding: 0; font-size: 14px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

/**
 * バリエーション在庫テーブルを更新
 */
function updateVariantsStockTable() {
    const section = document.getElementById('variantsStockSection');
    const table = document.getElementById('variantsStockTable');

    if (!section || !table) return;

    // 色もサイズもない場合は非表示
    if (productColors.length === 0 && productSizes.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // 色のみの場合
    if (productColors.length > 0 && productSizes.length === 0) {
        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 13px;">色</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 13px; width: 150px;">在庫数</th>
                    </tr>
                </thead>
                <tbody>
                    ${productColors.map(color => {
                        const key = color;
                        const stock = variantsStock[key] || 0;
                        return `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; font-size: 13px;">${color}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                    <input type="number"
                                           value="${stock}"
                                           min="0"
                                           onchange="updateVariantStock('${key}', this.value)"
                                           style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 13px;">
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        return;
    }

    // サイズのみの場合
    if (productSizes.length > 0 && productColors.length === 0) {
        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 13px;">サイズ</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 13px; width: 150px;">在庫数</th>
                    </tr>
                </thead>
                <tbody>
                    ${productSizes.map(size => {
                        const key = size;
                        const stock = variantsStock[key] || 0;
                        return `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; font-size: 13px;">${size}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                    <input type="number"
                                           value="${stock}"
                                           min="0"
                                           onchange="updateVariantStock('${key}', this.value)"
                                           style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 13px;">
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        return;
    }

    // 色とサイズ両方ある場合（マトリックス形式）
    if (productColors.length > 0 && productSizes.length > 0) {
        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 13px;">色 / サイズ</th>
                        ${productSizes.map(size => `
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 13px;">${size}</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${productColors.map(color => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: 500; font-size: 13px;">${color}</td>
                            ${productSizes.map(size => {
                                const key = `${color}-${size}`;
                                const stock = variantsStock[key] || 0;
                                return `
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                        <input type="number"
                                               value="${stock}"
                                               min="0"
                                               onchange="updateVariantStock('${key}', this.value)"
                                               style="width: 70px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 13px;">
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

/**
 * バリエーション在庫を更新
 */
function updateVariantStock(key, value) {
    const stock = parseInt(value) || 0;
    if (stock < 0) {
        showAlertModal('在庫数は0以上で入力してください', 'warning');
        updateVariantsStockTable();
        return;
    }
    variantsStock[key] = stock;

    // 基本在庫数を自動計算（全バリエーションの合計）
    updateTotalStock();
}

/**
 * 基本在庫数を自動計算
 */
function updateTotalStock() {
    // バリエーションがある場合、合計を計算
    if (productColors.length > 0 || productSizes.length > 0) {
        const total = Object.values(variantsStock).reduce((sum, stock) => sum + stock, 0);
        document.getElementById('productStock').value = total;
    }
}

/**
 * バリエーションデータを取得（保存用）
 */
function getVariantsData() {
    if (productColors.length === 0 && productSizes.length === 0) {
        return null; // バリエーションなし
    }

    return {
        colors: productColors,
        sizes: productSizes,
        stock: variantsStock
    };
}

/**
 * バリエーションデータをセット（読み込み用）
 */
function setVariantsData(variants) {
    console.log('📦 setVariantsData が呼ばれました:', variants);

    // リセット
    productColors = [];
    productSizes = [];
    variantsStock = {};

    if (!variants) {
        console.log('⚠️ variants が null/undefined です');
        renderColorsList();
        renderSizesList();
        updateVariantsStockTable();
        return;
    }

    // データをセット
    productColors = variants.colors || [];
    productSizes = variants.sizes || [];
    variantsStock = variants.stock || {};

    console.log('🎨 セットした色:', productColors);
    console.log('📏 セットしたサイズ:', productSizes);
    console.log('📊 セットした在庫:', variantsStock);

    // UIを更新
    renderColorsList();
    renderSizesList();
    updateVariantsStockTable();
}

/**
 * バリエーションデータをクリア
 */
function clearVariantsData() {
    productColors = [];
    productSizes = [];
    variantsStock = {};

    const colorInput = document.getElementById('newColorInput');
    const sizeInput = document.getElementById('newSizeInput');

    if (colorInput) colorInput.value = '';
    if (sizeInput) sizeInput.value = '';

    renderColorsList();
    renderSizesList();
    updateVariantsStockTable();
}
