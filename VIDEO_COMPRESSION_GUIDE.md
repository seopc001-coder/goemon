# 動画ファイル圧縮ガイド - Re:ラボLP最適化

## 現在の問題
- LCP (Largest Contentful Paint): **5.3秒** (目標: 2.5秒以下)
- 初回表示時間: **2.9秒**
- 動画ファイル `NEWhero-background.mp4` のサイズが大きい可能性

## 推奨される動画圧縮設定

### 1. FFmpegを使用した圧縮 (推奨)

```bash
ffmpeg -i NEWhero-background.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset slow \
  -vf "scale=1920:-1" \
  -movflags +faststart \
  -an \
  NEWhero-background-optimized.mp4
```

**パラメータ説明:**
- `-crf 28`: 圧縮率 (18-28推奨、数字が大きいほど圧縮率高い)
- `-preset slow`: エンコード品質 (slow = 高品質・高圧縮)
- `-vf "scale=1920:-1"`: 横幅1920pxにリサイズ (Full HD)
- `-movflags +faststart`: ストリーミング最適化
- `-an`: 音声トラック削除 (背景動画には不要)

### 2. 解像度別の推奨設定

#### デスクトップ用 (1920x1080)
```bash
ffmpeg -i NEWhero-background.mp4 -c:v libx264 -crf 26 -preset slow -vf "scale=1920:-1" -movflags +faststart -an NEWhero-desktop.mp4
```

#### モバイル用 (1280x720)
```bash
ffmpeg -i NEWhero-background.mp4 -c:v libx264 -crf 28 -preset slow -vf "scale=1280:-1" -movflags +faststart -an NEWhero-mobile.mp4
```

### 3. WebM形式での圧縮 (より軽量)

```bash
ffmpeg -i NEWhero-background.mp4 \
  -c:v libvpx-vp9 \
  -crf 30 \
  -b:v 0 \
  -vf "scale=1920:-1" \
  -an \
  NEWhero-background.webm
```

## HTMLでの実装 (レスポンシブ対応)

### 方法1: メディアクエリを使った動画切り替え

```html
<video class="hero__video" autoplay muted loop playsinline poster="./assets/hero-background.png" preload="auto" fetchpriority="high">
    <!-- モバイル用 (画面幅768px以下) -->
    <source src="./assets/NEWhero-mobile.mp4" type="video/mp4" media="(max-width: 768px)">

    <!-- デスクトップ用 -->
    <source src="./assets/NEWhero-desktop.mp4" type="video/mp4">

    <!-- WebM形式 (対応ブラウザ) -->
    <source src="./assets/NEWhero-background.webm" type="video/webm">
</video>
```

### 方法2: JavaScriptでの動的読み込み

```javascript
// main.js に追加
(function() {
    const video = document.querySelector('.hero__video');
    const isMobile = window.innerWidth <= 768;
    const videoSrc = isMobile
        ? './assets/NEWhero-mobile.mp4'
        : './assets/NEWhero-desktop.mp4';

    video.src = videoSrc;
    video.load();
})();
```

## 目標ファイルサイズ

| 解像度 | 長さ | 目標サイズ |
|--------|------|-----------|
| 1920x1080 (Desktop) | 10秒 | 500KB - 1MB |
| 1920x1080 (Desktop) | 20秒 | 1MB - 2MB |
| 1280x720 (Mobile) | 10秒 | 300KB - 600KB |
| 1280x720 (Mobile) | 20秒 | 600KB - 1.2MB |

## オンラインツール (FFmpegが使えない場合)

1. **Cloudinary** (無料プラン有り)
   - https://cloudinary.com/video-optimizer

2. **HandBrake** (無料デスクトップアプリ)
   - https://handbrake.fr/
   - プリセット: "Web" > "Gmail Small 5 Minutes 480p30"を参考に調整

3. **Online Video Converter**
   - https://www.freeconvert.com/video-compressor

## 圧縮後の確認ポイント

✅ **ファイルサイズ**: 元のファイルの30-50%に削減
✅ **画質**: ぼやけていないか目視確認
✅ **再生**: 自動再生・ループが正常に動作するか
✅ **LCP**: PageSpeed Insightsで2.5秒以下になったか

## 次のステップ

1. 現在の `NEWhero-background.mp4` のファイルサイズを確認
2. 上記のコマンドで圧縮
3. 圧縮版ファイルを `assets/` フォルダに配置
4. PageSpeed Insightsで再測定

## 参考: 現在の最適化済み設定

以下の最適化は既に実装済みです:

✅ 動画に `preload="auto"` と `fetchpriority="high"` を設定
✅ poster画像を優先読み込み
✅ 動画コンテナに明示的なサイズ指定
✅ レイアウトシフト防止のCSS設定
✅ Font Awesome, Google Fontsの遅延読み込み
✅ Google Analyticsの遅延読み込み
✅ GPU アクセラレーション有効化

---

**作成日**: 2025年1月17日
**対象LP**: Re:ラボ (https://relab.vercel.app)
