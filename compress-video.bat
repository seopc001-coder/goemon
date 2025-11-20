@echo off
echo ========================================
echo Re:ラボ LP 動画圧縮スクリプト
echo ========================================
echo.

:: FFmpegのパスを設定 (複数のパスを試行)
set FFMPEG=C:\ffmpeg-8.0\bin\ffmpeg.exe

:: FFmpegが存在するか確認
if not exist "%FFMPEG%" (
    set FFMPEG=C:\ffmpeg\bin\ffmpeg.exe
)

if not exist "%FFMPEG%" (
    echo エラー: FFmpegが見つかりません。
    echo 以下のパスを確認してください:
    echo - C:\ffmpeg-8.0\bin\ffmpeg.exe
    echo - C:\ffmpeg\bin\ffmpeg.exe
    echo.
    echo FFmpegをインストールしてから再度実行してください。
    pause
    exit /b 1
)

echo FFmpegを検出: %FFMPEG%
echo.

:: 動画ファイルが存在するか確認
if not exist "assets\NEWhero-background.mp4" (
    echo エラー: 動画ファイルが見つかりません。
    echo パス: assets\NEWhero-background.mp4
    pause
    exit /b 1
)

echo 圧縮前のファイルサイズ:
dir /s "assets\NEWhero-background.mp4" | find "NEWhero-background.mp4"
echo.

echo 動画を圧縮中...
echo.

:: 圧縮実行
"%FFMPEG%" -i "assets\NEWhero-background.mp4" -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-1" -movflags +faststart -an "assets\NEWhero-background-compressed.mp4"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo 圧縮完了!
    echo ========================================
    echo.
    echo 圧縮後のファイルサイズ:
    dir /s "assets\NEWhero-background-compressed.mp4" | find "NEWhero-background-compressed.mp4"
    echo.
    echo 次のステップ:
    echo 1. 元のファイルをバックアップ
    echo    ren assets\NEWhero-background.mp4 NEWhero-background-original.mp4
    echo.
    echo 2. 圧縮版をリネーム
    echo    ren assets\NEWhero-background-compressed.mp4 NEWhero-background.mp4
    echo.
    echo 3. ブラウザで動作確認
    echo    index.html を開く
    echo.
    echo 4. PageSpeed Insights で測定
    echo    https://pagespeed.web.dev/
    echo.
) else (
    echo.
    echo エラー: 圧縮に失敗しました。
)

pause
