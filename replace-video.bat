@echo off
echo ========================================
echo 動画ファイル置き換えスクリプト
echo ========================================
echo.

cd assets

if not exist "NEWhero-background-compressed.mp4" (
    echo エラー: 圧縮済みファイルが見つかりません。
    echo 先に compress-video.bat を実行してください。
    pause
    exit /b 1
)

echo 1. 元のファイルをバックアップ中...
ren NEWhero-background.mp4 NEWhero-background-original.mp4
echo    完了: NEWhero-background-original.mp4

echo.
echo 2. 圧縮版をリネーム中...
ren NEWhero-background-compressed.mp4 NEWhero-background.mp4
echo    完了: NEWhero-background.mp4

echo.
echo ========================================
echo ファイル置き換え完了!
echo ========================================
echo.
echo 次のステップ:
echo 1. index.html をブラウザで開いて動作確認
echo 2. PageSpeed Insights で測定
echo    https://pagespeed.web.dev/
echo.

pause
