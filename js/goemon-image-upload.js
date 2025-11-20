// 五右衛門 ECサイト - 画像アップロードユーティリティ

// Supabase設定（グローバルのsupabaseクライアントを使用）
const STORAGE_BUCKET = 'goemon-images';

// グローバルのsupabaseクライアントを参照
let supabaseClient = null;

function initializeSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase;
        console.log('Supabase client initialized for image upload');
    } else {
        console.warn('Supabase library not loaded. Using fallback mode.');
    }
}

// ページ読み込み時にSupabaseを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}

/**
 * 画像ファイルをアップロードしてURLを取得
 * @param {File} file - アップロードするファイル
 * @param {string} folder - 保存先フォルダ（'products', 'hero'など）
 * @returns {Promise<string>} - アップロードされた画像のURL
 */
async function uploadImage(file, folder = 'products') {
    try {
        // ファイルバリデーション
        const validationError = validateImageFile(file);
        if (validationError) {
            throw new Error(validationError);
        }

        // Supabaseが利用可能な場合
        if (supabaseClient) {
            return await uploadToSupabase(file, folder);
        } else {
            // フォールバック: Base64に変換（開発用）
            return await convertToBase64(file);
        }
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
}

/**
 * Supabase Storageにファイルをアップロード
 */
async function uploadToSupabase(file, folder) {
    try {
        // ファイル名を生成（タイムスタンプ + ランダム文字列）
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop();
        const fileName = `${folder}/${timestamp}_${randomStr}.${extension}`;

        // Supabase Storageにアップロード
        const { data, error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // 公開URLを取得
        const { data: urlData } = supabaseClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Supabase upload error:', error);
        throw new Error('画像のアップロードに失敗しました: ' + error.message);
    }
}

/**
 * Base64に変換（フォールバック用）
 */
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
        reader.readAsDataURL(file);
    });
}

/**
 * 画像ファイルのバリデーション
 */
function validateImageFile(file) {
    // ファイルサイズチェック（5MB以下）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return '画像サイズは5MB以下にしてください';
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return '画像形式はJPEG、PNG、WebPのみ対応しています';
    }

    return null;
}

/**
 * 画像プレビューを表示
 */
function showImagePreview(file, previewElementId) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewElement = document.getElementById(previewElementId);
        if (previewElement) {
            previewElement.innerHTML = `
                <img src="${e.target.result}" alt="プレビュー" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 4px;">
            `;
            previewElement.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

/**
 * 画像プレビューをクリア
 */
function clearImagePreview(previewElementId) {
    const previewElement = document.getElementById(previewElementId);
    if (previewElement) {
        previewElement.innerHTML = '';
        previewElement.style.display = 'none';
    }
}

/**
 * ファイル入力フィールドに変更イベントリスナーを追加
 */
function setupFileInput(inputId, previewId, urlInputId) {
    const fileInput = document.getElementById(inputId);
    const urlInput = document.getElementById(urlInputId);

    if (!fileInput) return;

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // プレビューを表示
            if (previewId) {
                showImagePreview(file, previewId);
            }

            // ローディング表示
            if (urlInput) {
                urlInput.value = 'アップロード中...';
                urlInput.disabled = true;
            }

            // 画像をアップロード
            const folder = inputId.includes('hero') ? 'hero' : 'products';
            const imageUrl = await uploadImage(file, folder);

            // URLフィールドに設定
            if (urlInput) {
                urlInput.value = imageUrl;
                urlInput.disabled = false;
            }

            console.log('Image uploaded successfully:', imageUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('画像のアップロードに失敗しました: ' + error.message);

            // エラー時はフィールドをクリア
            if (urlInput) {
                urlInput.value = '';
                urlInput.disabled = false;
            }
            if (previewId) {
                clearImagePreview(previewId);
            }
        }
    });
}

/**
 * 複数ファイル入力のセットアップ（商品画像用）
 */
function setupMultipleFileInputs(inputIds, previewIds, urlInputIds) {
    inputIds.forEach((inputId, index) => {
        setupFileInput(inputId, previewIds[index], urlInputIds[index]);
    });
}
