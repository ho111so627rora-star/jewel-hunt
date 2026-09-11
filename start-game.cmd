@echo off
cd /d "%~dp0"
if exist "%~dp0.runtime\node-v22.23.2-win-x64\node.exe" set "PATH=%~dp0.runtime\node-v22.23.2-win-x64;%PATH%"
echo Jewel Hunt everyday: http://localhost:3000
echo Keep this window open while playing.
if exist ".next\BUILD_ID" (
  call npm.cmd start
) else (
  call npm.cmd run dev
)
pause
