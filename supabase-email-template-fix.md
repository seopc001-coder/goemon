# Supabaseメールテンプレート修正手順

## 問題
メールからパスワード再設定ページが開けない

## 原因
Supabaseのメールテンプレートで使用されているリンクURLが正しく設定されていない可能性があります。

## 解決手順

### 1. Supabase Dashboardにログイン
https://app.supabase.com にアクセス

### 2. プロジェクトを選択
五右衛門ECサイトのプロジェクトを選択

### 3. Authentication → Email Templates
左サイドバーから「Authentication」→「Email Templates」を選択

### 4. "Confirm recovery" テンプレートを編集
パスワードリセット用のテンプレートを選択

### 5. テンプレート内のリンクを確認

現在のテンプレートに以下のような記述があるはずです:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">パスワードを再設定</a>
```

または

```html
<a href="{{ .ConfirmationURL }}">パスワードを再設定</a>
```

### 6. 推奨される修正方法

**方法A: redirect_to パラメータを使用（推奨）**

JavaScriptコード側で既に `redirectTo` を指定しているので、Supabaseが自動的に正しいURLを生成するはずです。
もしテンプレートが以下のようになっていない場合は修正してください:

```html
<a href="{{ .ConfirmationURL }}">パスワードを再設定</a>
```

**方法B: 直接URLを指定**

もし `.ConfirmationURL` が機能しない場合は、直接URLを指定:

```html
<a href="https://goemon-flame.vercel.app/goemon-reset-password.html#access_token={{ .Token }}&type=recovery">パスワードを再設定</a>
```

⚠️ **注意**: 方法Bは推奨されません。Supabaseの仕様変更で動作しなくなる可能性があります。

### 7. URL Configuration（Redirect URLs）を確認

Authentication → URL Configuration で以下のURLが登録されているか確認:

```
https://goemon-flame.vercel.app/goemon-reset-password.html
```

Site URLも確認:
```
https://goemon-flame.vercel.app
```

### 8. テスト

1. 管理画面からパスワード再設定メールを送信
2. メールを受信
3. メール内のリンクをクリック
4. パスワード再設定ページが開くことを確認

## トラブルシューティング

### メールリンクをクリックしても何も起こらない場合

1. メールクライアントのリンクを右クリック → 「リンクをコピー」
2. ブラウザのアドレスバーに貼り付けて手動で開く
3. 診断ページで確認: https://goemon-flame.vercel.app/goemon-reset-password-test.html

### 404エラーが表示される場合

- Vercelにファイルが正しくデプロイされているか確認
- ブラウザのキャッシュをクリア（Ctrl+Shift+R または Cmd+Shift+R）

### トークンエラーが表示される場合

- メールの有効期限（通常1時間）が切れていないか確認
- 新しいパスワード再設定メールを送信して再試行

## 参考資料

Supabase公式ドキュメント:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-password-reset

