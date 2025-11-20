@echo off
echo ========================================
echo Re:ラボ 動画圧縮 簡易版
echo ========================================
echo.
echo このスクリプトを実行する前に:
echo 1. ffmpeg-8.0フォルダをCドライブ直下に移動してください
echo    (現在の場所から C:\ にドラッグ&ドロップ)
echo.
echo 2. フォルダ名を確認してください
echo    C:\ffmpeg-8.0 になっているか確認
echo.
pause

if exist "C:\Users\senaa\Desktop\ffmpeg-8.0\bin\ffmpeg.exe" (
    echo FFmpegを検出しました!
    echo.
    echo 圧縮を開始します...
    echo.

    "C:\Users\senaa\Desktop\ffmpeg-8.0\bin\ffmpeg.exe" -i "assets\NEWhero-background.mp4" -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-1" -movflags +faststart -an "assets\NEWhero-background-compressed.mp4" -y

    if exist "assets\NEWhero-background-compressed.mp4" (
        echo.
        echo ========================================
        echo 圧縮完了!
        echo ========================================
        echo.
        dir "assets\NEWhero-background*.mp4"
        echo.
        echo 次は replace-video.bat を実行してください
    ) else (
        echo.
        echo エラー: 圧縮に失敗しました
    )
) else (
    echo エラー: C:\Users\senaa\Desktop\ffmpeg-8.0\bin\ffmpeg.exe が見つかりません
    echo.
    echo ffmpeg-8.0フォルダの場所を確認してください
)

echo.
pause
