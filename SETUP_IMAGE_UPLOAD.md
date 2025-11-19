# 画像アップロード機能 セットアップガイド

このガイドでは、五右衛門ECサイトに画像アップロード機能を設定する方法を説明します。

## 概要

画像アップロード機能は以下の場所で使用できます：
- **商品管理画面**: メイン画像 + サブ画像3枚（合計4枚）
- **ヒーロー画像設定**: トップページのスライダー画像

## セットアップ手順

### 方法1: Supabase Storage を使用（推奨）

Supabaseは無料プランで1GBのストレージが利用できます。

#### 1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリックしてアカウント作成
3. 新しいプロジェクトを作成

#### 2. Storage Bucketの作成

1. Supabaseダッシュボードで「Storage」を選択
2. 「New Bucket」をクリック
3. Bucket名を `goemon-images` に設定
4. 「Public bucket」をONにする（画像を公開アクセス可能にする）
5. 「Save」をクリック

#### 3. 設定情報の取得

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 以下の情報をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` で始まる長い文字列

#### 4. 設定ファイルの更新

`js/goemon-image-upload.js`を開き、以下の箇所を更新：

```javascript
// Supabase設定（実際の値に置き換えてください）
const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // ← ここに Project URL を貼り付け
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // ← ここに anon public key を貼り付け
const STORAGE_BUCKET = 'goemon-images';  // Bucket名（変更した場合は合わせる）
```

#### 5. 動作確認

1. 商品管理画面（`goemon-admin-products.html`）を開く
2. 商品追加モーダルで「ファイルを選択」から画像を選択
3. アップロードが完了すると、画像URLが自動で入力される
4. プレビューに画像が表示される

### 方法2: 開発用フォールバックモード

Supabaseを設定しない場合、自動的にBase64エンコードモードになります。
この方法は開発・テスト用で、画像データがlocalStorageに保存されます。

**注意**: Base64モードは以下の制限があります：
- データサイズが大きくなる
- localStorageの容量制限（5-10MB）に注意
- 本番環境には不向き

## 使用方法

### 商品画像のアップロード

1. 商品管理画面で「商品を追加」または商品編集
2. 画像セクションで以下のいずれかを選択：
   - **ファイルアップロード**: 「ファイルを選択」ボタンから画像を選択
   - **URL直接入力**: 既存の画像URLを入力

3. ファイルを選択すると：
   - プレビューが表示される
   - 自動的にアップロードされる
   - URLフィールドに画像URLが入力される

### ヒーロー画像のアップロード

1. 設定画面（`goemon-admin-settings.html`）の「ヒーロー画像設定」タブ
2. 「画像を追加」をクリック
3. 画像セクションで：
   - **ファイルアップロード**: 「ファイルを選択」ボタンから画像を選択
   - **URL直接入力**: 既存の画像URLを入力

### 対応画像形式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### ファイルサイズ制限

- 最大サイズ: 5MB
- 推奨サイズ: 1-2MB（ページ読み込み速度のため）

## トラブルシューティング

### 画像がアップロードされない

1. **Supabase設定を確認**
   - `js/goemon-image-upload.js`の設定値が正しいか確認
   - ブラウザのコンソールでエラーメッセージを確認

2. **Bucket設定を確認**
   - Bucketが「Public」になっているか確認
   - Bucket名が`goemon-images`と一致しているか確認

3. **ファイルサイズを確認**
   - 5MB以下の画像を使用
   - 必要に応じて画像を圧縮

### プレビューが表示されない

- ブラウザのコンソールでエラーを確認
- ファイル形式が対応形式か確認

### Base64モードを使用している

- Supabaseライブラリが読み込まれていない可能性
- HTMLファイルに以下のscriptタグがあるか確認：
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  ```

## セキュリティに関する注意

1. **Supabase Keys**
   - anon public keyは公開しても安全（フロントエンド用）
   - service_role keyは絶対に公開しない

2. **Storage Policies**
   - 本番環境では適切なRow Level Security (RLS)を設定
   - 不要なファイルは定期的に削除

3. **ファイルサイズ制限**
   - サーバー側でもファイルサイズを制限する
   - 悪意のあるアップロードを防ぐ

## 追加の最適化

### 画像の自動リサイズ

Supabase Functionsを使用して、アップロード時に画像を自動リサイズできます：
1. Supabase CLIをインストール
2. Edge Functionを作成して画像処理ロジックを実装
3. アップロード時にFunctionを呼び出す

### CDN配信

Supabase Storageは自動的にCDNから配信されますが、
さらなる最適化のため、Cloudflare等のCDNを追加できます。

## サポート

問題が解決しない場合は：
- ブラウザのコンソールログを確認
- Supabaseダッシュボードのログを確認
- ネットワークタブでリクエスト/レスポンスを確認
