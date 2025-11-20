# WebM動画変換ガイド - 簡単3ステップ

## 📋 なぜWebMが必要？

現在のLCP（最大コンテンツの描画時間）: **7.1秒** ❌
目標: **2.5秒以下** ✅

WebM形式に変換すると、動画ファイルサイズが **30-50%削減** できます！

---

## 🚀 CloudConvertで簡単変換（おすすめ）

### ステップ1: サイトにアクセス
1. ブラウザで開く: **https://cloudconvert.com/mp4-to-webm**
2. アカウント登録不要・完全無料

### ステップ2: ファイルをアップロード
1. 「Select File」ボタンをクリック
2. 以下のファイルを選択:
   ```
   C:\Users\senaa\Desktop\個人生成管理\リラボLP作成依頼\assets\NEWhero-background.mp4
   ```
3. 設定を確認:
   - **入力形式**: MP4
   - **出力形式**: WebM
   - **品質設定**: Medium～High (推奨: Medium)

### ステップ3: 変換して保存
1. 「Convert」ボタンをクリック
2. 変換完了後、「Download」ボタンをクリック
3. ダウンロードしたファイルの名前を変更:
   - ダウンロード名: `NEWhero-background.webm`
   - 保存先: `C:\Users\senaa\Desktop\個人生成管理\リラボLP作成依頼\assets\NEWhero-background.webm`

---

## ✅ 完了後の確認

### ファイルが正しく配置されているか確認:
```
C:\Users\senaa\Desktop\個人生成管理\リラボLP作成依頼\assets\
├── NEWhero-background.webm  ← 新しく追加
├── NEWhero-background.mp4   ← 既存（フォールバック用に残す）
└── hero-background.png      ← ポスター画像
```

### ブラウザで動作確認:
1. `index.html` をブラウザで開く
2. ヒーロー動画が正常に再生されるか確認
3. パーティクルとオーバーレイのアニメーションが正常か確認

### PageSpeed Insightsで測定:
1. https://pagespeed.web.dev/ を開く
2. URLまたはファイルをアップロード
3. **LCPが2.5秒以下**になっているか確認 ✅

---

## 🎯 期待される改善結果

| 指標 | 現在 | 目標 | 改善方法 |
|------|------|------|----------|
| **Performance** | 66点 | 85-90点 | WebM変換 |
| **LCP** | 7.1秒 | <2.5秒 | WebM変換 |
| **CLS** | 0 | 0 | ✅ 完了 |
| **ファイルサイズ** | 411KB | 200-250KB | WebM変換 |

---

## 💡 HTMLの対応状況

すでにHTMLは更新済みです：

```html
<video class="hero__video" autoplay muted loop playsinline poster="./assets/hero-background.png" preload="auto" fetchpriority="high">
    <source src="./assets/NEWhero-background.webm" type="video/webm">  ← WebM優先
    <source src="./assets/NEWhero-background.mp4" type="video/mp4">    ← フォールバック
</video>
```

**仕組み:**
- ブラウザは最初に `.webm` を試します（Chrome, Firefox, Edge対応）
- WebM非対応の古いブラウザは自動的に `.mp4` を使用
- すべてのブラウザで動作保証 ✅

---

## 🔧 代替方法: HandBrake（オフラインツール）

もしオフラインで変換したい場合:

1. **HandBrakeをダウンロード**: https://handbrake.fr/downloads.php
2. インストール後、起動
3. 「Source」→ `NEWhero-background.mp4` を選択
4. 「Format」→ `WebM` を選択
5. 「Video」タブ:
   - Encoder: VP9
   - Quality: RF 28-32 (推奨: 30)
6. 「Save As」→ `NEWhero-background.webm`
7. 「Start Encode」をクリック

---

## 📞 サポート

変換やファイル配置で問題が発生した場合は、エラーメッセージのスクリーンショットを共有してください。
