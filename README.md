# 五右衛門 ECサイト

女性向けファッションECサイト

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript (Vanilla)
- **バックエンド**: Supabase (認証・データベース)
- **デプロイ**: Vercel
- **アイコン**: Font Awesome

## 主な機能

- 商品一覧・検索
- 商品詳細
- ショッピングカート
- お気に入り機能
- ユーザー認証 (Supabase)
- マイページ

## ローカル開発

1. プロジェクトをクローン
2. `supabase-config.js` にSupabaseの認証情報を設定
3. ローカルサーバーで実行 (Live Server等)

## デプロイ

Vercel にデプロイ済み:
- URL: https://goemon-flame.vercel.app/

変更をプッシュすると自動的にデプロイされます。

## ファイル構成

```
├── css/              # スタイルシート
├── js/               # JavaScript
│   ├── supabase-config.js
│   ├── goemon-products-data.js
│   └── ...
├── goemon-*.html     # 各ページ
└── vercel.json       # Vercel設定
```

## 注意事項

- `supabase-config.js` の認証情報は公開しない
- GitHub に `.env` ファイルをプッシュしない
