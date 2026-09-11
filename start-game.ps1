$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$jewelNodeDirectory = Join-Path $PSScriptRoot '.runtime\node-v22.23.2-win-x64'
if (Test-Path (Join-Path $jewelNodeDirectory 'node.exe')) {
  $env:Path = $jewelNodeDirectory + ';' + $env:Path
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js 22 or later is required.'
}
Write-Host 'Jewel Hunt everyday: http://localhost:3000'
Write-Host 'For a phone on the same Wi-Fi, use this PC IPv4 address with :3000.'
if (Test-Path '.next\BUILD_ID') { npm.cmd start } else { npm.cmd run dev }
