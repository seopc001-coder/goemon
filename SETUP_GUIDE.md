# Re:ラボ LP セットアップガイド

このドキュメントでは、LPを公開するまでの手順を詳しく説明します。

## 📋 目次

1. [公開前の準備](#公開前の準備)
2. [必要な画像・動画の追加](#必要な画像動画の追加)
3. [設定の更新](#設定の更新)
4. [ホスティングサービスの選択](#ホスティングサービスの選択)
5. [デプロイ手順](#デプロイ手順)
6. [公開後の設定](#公開後の設定)
7. [トラブルシューティング](#トラブルシューティング)

---

## 🎬 公開前の準備

### ステップ1: ファイルの確認

現在のプロジェクト構造:
```
リラボLP作成依頼/
├── index.html          ✅ 完成
├── css/
│   └── style.css       ✅ 完成
├── js/
│   └── main.js         ✅ 完成
├── assets/
│   ├── logo.png        ✅ 配置済み
│   ├── logo-alt.png    ✅ 配置済み
│   ├── hero-video.mp4  ❌ 追加必要
│   ├── og-image.jpg    ❌ 追加必要
│   ├── favicon.png     ❌ 追加必要
│   └── line-qr.png     ❌ 追加必要
├── robots.txt          ✅ 完成
├── sitemap.xml         ✅ 完成
└── README.md           ✅ 完成
```

---

## 🖼️ 必要な画像・動画の追加

### 1. ヒーロー動画 (hero-video.mp4)

**方法A: フリー動画サイトから入手**

1. [Pexels Videos](https://pexels.com/videos) にアクセス
2. 検索キーワード: "neon lights", "city night", "technology"
3. 気に入った動画をダウンロード
4. 動画編集ソフトで以下に調整:
   - サイズ: 1920x1080px
   - 長さ: 10-20秒でループ
   - ファイル名を `hero-video.mp4` に変更
5. `assets/` フォルダに配置

**方法B: AI動画生成**

1. [Runway](https://runwayml.com) または [Pika Labs](https://pika.art) を使用
2. プロンプト例:
   ```
   Neon light effects, social media icons floating,
   modern tech background, cyberpunk style, loop animation
   ```
3. 生成された動画をダウンロード
4. `assets/hero-video.mp4` として保存

**動画がない場合の代替案:**

動画の代わりに静止画を使用する場合、`index.html` を以下のように変更:

```html
<!-- 変更前 -->
<div class="hero__video-container">
    <video class="hero__video" autoplay muted loop playsinline>
        <source src="./assets/hero-video.mp4" type="video/mp4">
    </video>
    <div class="hero__overlay"></div>
</div>

<!-- 変更後 -->
<div class="hero__video-container">
    <div class="hero__image" style="background-image: url('./assets/hero-bg.jpg');"></div>
    <div class="hero__overlay"></div>
</div>
```

CSSに追加:
```css
.hero__image {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}
```

---

### 2. OGP画像 (og-image.jpg)

**Canvaでの作成手順:**

1. [Canva](https://canva.com) にアクセス
2. 「カスタムサイズ」で 1200x630px を作成
3. デザイン要素:
   - 背景: 黒 (#0A0A0A)
   - Re:ラボのロゴを中央上部に配置
   - キャッチコピー: 「ナイトワークの"これから"をデザインする」
   - サブテキスト: 「Twitter運用代行サービス」
   - ネオンエフェクトを追加
4. 「ダウンロード」→ JPG形式
5. `assets/og-image.jpg` として保存

**デザインテンプレート:**
```
┌──────────────────────────────────────────┐
│                                          │
│         [Re:ラボ ロゴ]                   │
│                                          │
│    ナイトワークの"これから"を           │
│          デザインする                   │
│                                          │
│     Twitter運用代行サービス             │
│                                          │
│   満足度99% | 無料キャンペーン実施中    │
│                                          │
└──────────────────────────────────────────┘
```

---

### 3. Favicon (favicon.png)

**作成方法:**

1. ロゴ画像 (`logo.png`) を開く
2. 画像編集ソフトで 32x32px にリサイズ
3. PNG形式で保存（透過背景推奨）
4. `assets/favicon.png` として保存

**オンラインツール:**
- [Favicon.io](https://favicon.io) - テキストやロゴからfaviconを生成
- [RealFaviconGenerator](https://realfavicongenerator.net) - 全デバイス対応favicon生成

---

### 4. LINE QRコード (line-qr.png)

**取得方法:**

1. LINE公式アカウント管理画面にログイン
2. 「ホーム」→「友だち追加」
3. 「QRコード」タブを選択
4. 「QRコードをダウンロード」
5. `assets/line-qr.png` として保存

**HTMLへの反映:**

`index.html` の以下の部分を修正:

```html
<!-- 変更前 -->
<div class="qr-placeholder">
    <span>📱</span>
    <p>LINE QRコード</p>
</div>

<!-- 変更後 -->
<div class="qr-placeholder">
    <img src="./assets/line-qr.png" alt="LINE QRコード" style="width: 100%; height: 100%; object-fit: contain;">
</div>
```

---

## ⚙️ 設定の更新

### 1. LINE URLの設定

`index.html` を開き、以下の箇所を修正:

```html
<!-- 検索: https://line.me/R/ti/p/ -->
<!-- あなたのLINE URLに変更 -->
<a href="https://line.me/R/ti/p/@YOUR_LINE_ID" class="btn-line btn-large" target="_blank" rel="noopener">
```

**LINE URLの取得方法:**
1. LINE公式アカウント管理画面
2. 「友だち追加」→「URLをコピー」
3. 上記の `@YOUR_LINE_ID` 部分に貼り付け

---

### 2. ドメイン設定

公開後、以下のファイルのドメインを更新:

#### `sitemap.xml`
```xml
<loc>https://yourdomain.com/</loc>
<!-- ↓ -->
<loc>https://あなたのドメイン.com/</loc>
```

#### `robots.txt`
```
Sitemap: https://yourdomain.com/sitemap.xml
<!-- ↓ -->
Sitemap: https://あなたのドメイン.com/sitemap.xml
```

#### `index.html`
```html
<meta property="og:url" content="https://あなたのドメイン.com">
```

---

## 🌐 ホスティングサービスの選択

### おすすめのホスティングサービス

#### 1. Netlify (推奨)
**メリット:**
- ✅ 無料プラン充実
- ✅ 自動SSL対応
- ✅ CDN標準搭載
- ✅ GitHubと連携可能
- ✅ 簡単デプロイ

**料金:** 無料〜

**向いているケース:**
- 初めてのLP公開
- 低コストで始めたい
- 技術的な知識が少ない

---

#### 2. Vercel
**メリット:**
- ✅ 高速パフォーマンス
- ✅ 無料プラン
- ✅ 自動最適化
- ✅ プレビューURL生成

**料金:** 無料〜

**向いているケース:**
- 最新技術を使いたい
- パフォーマンス重視
- 頻繁に更新する

---

#### 3. さくらのレンタルサーバー
**メリット:**
- ✅ 日本企業で安心
- ✅ 電話サポート
- ✅ 独自ドメイン取得可能

**料金:** 月額131円〜

**向いているケース:**
- 日本語サポート重視
- 将来的にWordPress追加予定
- メールアドレスも欲しい

---

#### 4. エックスサーバー
**メリット:**
- ✅ 高速・安定
- ✅ 手厚いサポート
- ✅ 独自SSL無料

**料金:** 月額990円〜

**向いているケース:**
- ビジネス用途
- 複数サイト運営予定
- 安定性重視

---

## 🚀 デプロイ手順

### パターンA: Netlify でのデプロイ（推奨）

#### 手順1: Netlifyアカウント作成
1. [Netlify](https://netlify.com) にアクセス
2. 「Sign up」をクリック
3. GitHubまたはメールアドレスで登録

#### 手順2: サイトのアップロード
1. Netlifyダッシュボードにログイン
2. 「Add new site」→「Deploy manually」
3. プロジェクトフォルダをドラッグ&ドロップ
4. デプロイ完了を待つ（1-2分）

#### 手順3: カスタムドメインの設定（オプション）
1. サイト設定 → Domain management
2. 「Add custom domain」
3. ドメインを入力して設定
4. DNS設定を変更（ドメイン管理画面で）

---

### パターンB: Vercel でのデプロイ

#### 手順1: Vercelアカウント作成
1. [Vercel](https://vercel.com) にアクセス
2. GitHubアカウントで登録

#### 手順2: プロジェクトのインポート
1. 「New Project」をクリック
2. 「Upload」を選択
3. プロジェクトフォルダをアップロード
4. 「Deploy」をクリック

---

### パターンC: レンタルサーバー（FTP）でのデプロイ

#### 手順1: FTPクライアントのインストール
- [FileZilla](https://filezilla-project.org) を推奨

#### 手順2: サーバー接続情報の確認
レンタルサーバーの管理画面から以下を確認:
- FTPホスト名
- FTPユーザー名
- FTPパスワード
- ポート番号（通常は21）

#### 手順3: ファイルのアップロード
1. FileZillaを起動
2. 接続情報を入力して接続
3. ローカル側: プロジェクトフォルダ
4. リモート側: `public_html` または `www` フォルダ
5. 全ファイルをアップロード

---

## 🔧 公開後の設定

### 1. Google Analytics の設定

#### GA4トラッキングコードの追加

1. [Google Analytics](https://analytics.google.com) にアクセス
2. アカウントとプロパティを作成
3. 測定IDをコピー（G-XXXXXXXXXX）
4. `index.html` の `</head>` タグの直前に追加:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
</head>
```

---

### 2. Google Search Console の設定

#### 手順1: プロパティの追加
1. [Google Search Console](https://search.google.com/search-console) にアクセス
2. 「プロパティを追加」
3. URLプレフィックスを選択
4. サイトURLを入力

#### 手順2: 所有権の確認
**方法A: HTMLタグ**
```html
<meta name="google-site-verification" content="あなたの確認コード" />
```
を `<head>` 内に追加

**方法B: HTMLファイル**
ダウンロードしたファイルをルートディレクトリにアップロード

#### 手順3: サイトマップの送信
1. 「サイトマップ」メニューを開く
2. `https://yourdomain.com/sitemap.xml` を入力
3. 「送信」をクリック

---

### 3. パフォーマンスの確認

#### PageSpeed Insights でテスト
1. [PageSpeed Insights](https://pagespeed.web.dev) にアクセス
2. サイトURLを入力
3. スコアを確認:
   - 90以上: 優秀 ✅
   - 50-89: 改善の余地あり ⚠️
   - 50未満: 要改善 ❌

#### 改善のヒント:
- 画像を圧縮（TinyPNG）
- 動画ファイルサイズを削減
- 不要なJavaScriptを削除
- ブラウザキャッシュを活用

---

### 4. SSL証明書の確認

#### チェック方法:
1. ブラウザでサイトを開く
2. URLバーに 🔒 マークが表示されているか確認
3. `https://` で始まっているか確認

**注意:**
- Netlify / Vercel は自動でSSL設定
- レンタルサーバーの場合は手動設定が必要な場合あり

---

## ❓ トラブルシューティング

### よくある問題と解決方法

#### Q1: 画像が表示されない
**原因:**
- ファイルパスが間違っている
- ファイル名の大文字小文字が違う
- ファイルがアップロードされていない

**解決方法:**
1. ブラウザの開発者ツール（F12）を開く
2. Consoleタブでエラーを確認
3. ファイルパスを修正
4. ファイルを再アップロード

---

#### Q2: 動画が再生されない
**原因:**
- ファイル形式が対応していない
- ファイルサイズが大きすぎる
- モバイルで自動再生がブロックされている

**解決方法:**
1. MP4形式（H.264コーデック）を使用
2. ファイルサイズを10MB以下に削減
3. `muted` 属性が設定されているか確認
4. 代替として静止画を使用

---

#### Q3: スマホで表示が崩れる
**原因:**
- レスポンシブ対応の問題
- ビューポート設定の不備

**解決方法:**
1. `<meta name="viewport">` タグが正しいか確認
2. ブラウザの開発者ツールでモバイル表示をテスト
3. CSSのメディアクエリを確認

---

#### Q4: LINE URLがうまく動作しない
**原因:**
- URLが正しくない
- リンクが切れている

**解決方法:**
1. LINE公式アカウント管理画面でURLを再確認
2. ブラウザで直接URLを開いてテスト
3. `target="_blank"` と `rel="noopener"` が設定されているか確認

---

#### Q5: Google Analyticsでデータが表示されない
**原因:**
- トラッキングコードが正しく設置されていない
- データ反映に時間がかかっている

**解決方法:**
1. リアルタイムレポートで確認（即座に反映）
2. トラッキングコードが `</head>` の前にあるか確認
3. 測定IDが正しいか確認
4. 広告ブロッカーを無効にしてテスト

---

## 📞 サポートリソース

### 公式ドキュメント
- [Netlify Docs](https://docs.netlify.com)
- [Vercel Docs](https://vercel.com/docs)
- [Google Analytics ヘルプ](https://support.google.com/analytics)
- [Google Search Console ヘルプ](https://support.google.com/webmasters)

### コミュニティ
- Stack Overflow (技術的な質問)
- GitHub Issues (コードの問題)

---

## ✅ 公開チェックリスト

公開前に以下を確認してください:

### 必須項目
- [ ] 全ての画像・動画ファイルが配置されている
- [ ] LINE URLが正しく設定されている
- [ ] ロゴが表示されている
- [ ] 全てのリンクが動作する
- [ ] モバイルで正しく表示される
- [ ] 各セクションが正常に動作する

### SEO関連
- [ ] タイトルタグが設定されている
- [ ] メタディスクリプションが設定されている
- [ ] OGP画像が表示される
- [ ] Faviconが表示される
- [ ] robots.txtが配置されている
- [ ] sitemap.xmlが配置されている

### アナリティクス
- [ ] Google Analyticsが設定されている
- [ ] Google Search Consoleが設定されている
- [ ] サイトマップが送信されている

### パフォーマンス
- [ ] ページ速度スコア 80以上
- [ ] 画像が最適化されている
- [ ] SSL証明書が有効
- [ ] 全てのブラウザでテスト済み

---

## 🎉 完了!

これでRe:ラボのLPが公開されました！

### 次のステップ
1. SNSで告知
2. 定期的なコンテンツ更新
3. A/Bテストの実施
4. ユーザーフィードバックの収集
5. SEOパフォーマンスのモニタリング

ご不明な点がございましたら、開発チームまでお問い合わせください。

---

**最終更新:** 2025年1月13日
