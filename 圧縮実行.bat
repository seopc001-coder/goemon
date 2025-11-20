@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "compress-video.ps1"
