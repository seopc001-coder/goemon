# Re:ラボ LP 動画圧縮スクリプト (PowerShell版)
# 実行方法: このファイルを右クリック → "PowerShellで実行"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Re:ラボ LP 動画圧縮スクリプト" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# FFmpegのパス
$ffmpegPath = "C:\ffmpeg-8.0\bin\ffmpeg.exe"

if (-not (Test-Path $ffmpegPath)) {
    $ffmpegPath = "C:\ffmpeg\bin\ffmpeg.exe"
}

if (-not (Test-Path $ffmpegPath)) {
    Write-Host "エラー: FFmpegが見つかりません。" -ForegroundColor Red
    Write-Host "以下のパスを確認してください:" -ForegroundColor Yellow
    Write-Host "- C:\ffmpeg-8.0\bin\ffmpeg.exe" -ForegroundColor Yellow
    Write-Host "- C:\ffmpeg\bin\ffmpeg.exe" -ForegroundColor Yellow
    Read-Host "`nEnterキーを押して終了"
    exit 1
}

Write-Host "✓ FFmpegを検出: $ffmpegPath" -ForegroundColor Green
Write-Host ""

# 動画ファイルの確認
$videoPath = "assets\NEWhero-background.mp4"
if (-not (Test-Path $videoPath)) {
    Write-Host "エラー: 動画ファイルが見つかりません。" -ForegroundColor Red
    Write-Host "パス: $videoPath" -ForegroundColor Yellow
    Read-Host "`nEnterキーを押して終了"
    exit 1
}

# 圧縮前のファイルサイズ
$beforeSize = (Get-Item $videoPath).Length
$beforeSizeMB = [math]::Round($beforeSize / 1MB, 2)
Write-Host "圧縮前のファイルサイズ: $beforeSizeMB MB ($beforeSize bytes)" -ForegroundColor White
Write-Host ""

Write-Host "動画を圧縮中..." -ForegroundColor Yellow
Write-Host "※ 処理には1-2分かかります。しばらくお待ちください..." -ForegroundColor Gray
Write-Host ""

# FFmpegコマンド実行
$outputPath = "assets\NEWhero-background-compressed.mp4"
$arguments = @(
    "-i", $videoPath,
    "-c:v", "libx264",
    "-crf", "28",
    "-preset", "slow",
    "-vf", "scale=1920:-1",
    "-movflags", "+faststart",
    "-an",
    $outputPath,
    "-y"
)

try {
    $process = Start-Process -FilePath $ffmpegPath -ArgumentList $arguments -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "圧縮完了!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""

        # 圧縮後のファイルサイズ
        $afterSize = (Get-Item $outputPath).Length
        $afterSizeMB = [math]::Round($afterSize / 1MB, 2)
        $reduction = [math]::Round((1 - $afterSize / $beforeSize) * 100, 1)

        Write-Host "圧縮後のファイルサイズ: $afterSizeMB MB ($afterSize bytes)" -ForegroundColor White
        Write-Host "削減率: $reduction%" -ForegroundColor Cyan
        Write-Host ""

        Write-Host "次のステップ:" -ForegroundColor Yellow
        Write-Host "1. ファイルを置き換え" -ForegroundColor White
        Write-Host "   replace-video.bat を実行" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. ブラウザで動作確認" -ForegroundColor White
        Write-Host "   index.html を開く" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. PageSpeed Insights で測定" -ForegroundColor White
        Write-Host "   https://pagespeed.web.dev/" -ForegroundColor Gray
        Write-Host ""

    } else {
        Write-Host ""
        Write-Host "エラー: 圧縮に失敗しました。" -ForegroundColor Red
        Write-Host "終了コード: $($process.ExitCode)" -ForegroundColor Yellow
    }

} catch {
    Write-Host ""
    Write-Host "エラー: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "`nEnterキーを押して終了"
