@echo off
setlocal
rem Garmin dashboard in Chrome kiosk mode (own TLS stack, CORS check off for this profile only).
rem Before launch it fetches the latest release from GitHub and replaces the HTML if the SHA-256 matches.
rem Any update failure (offline, timeout, bad hash) keeps the current file. Log: %USERPROFILE%\garmin-dash-update.log

rem 1 = check GitHub for a new version on every start, 0 = never update
set "UPDATE=1"
set "REPO=OlegDegterov/personal_health"
set "HTML=%USERPROFILE%\Desktop\garmin-dashboard.html"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chrome not found. Edit CHROME path in this file.
  pause
  exit /b 1
)

if not "%UPDATE%"=="1" goto launch
echo Checking for dashboard updates...
set "SELF=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex (((Get-Content -LiteralPath $env:SELF -Raw) -split '(?m)^#PS_BEGIN\s*$',2)[1])"

:launch

if not exist "%HTML%" (
  echo File not found: %HTML%
  echo Put garmin-dashboard.html on the Desktop or edit HTML path in this file.
  pause
  exit /b 1
)
set "URL=file:///%HTML:\=/%"
start "" "%CHROME%" --kiosk --user-data-dir="%USERPROFILE%\garmin-dash-chrome" --disable-web-security --allow-file-access-from-files --no-first-run --disable-background-networking --disable-sync --disable-extensions --disable-translate "%URL%"
exit /b 0

rem ---- Everything below is PowerShell (Windows 8.1 ships PS 4.0); cmd never gets here. ----
#PS_BEGIN
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$log = Join-Path $env:USERPROFILE 'garmin-dash-update.log'
function Write-Log([string]$msg) {
  try { Add-Content -LiteralPath $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $msg) } catch { }
}
$tmp = $null
try {
  # PS 4 defaults to TLS 1.0, which GitHub rejects.
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $base = "https://github.com/$($env:REPO)/releases/latest/download"
  $tmp = Join-Path $env:TEMP ('garmin-dash-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  $sumsFile = Join-Path $tmp 'SHA256SUMS.txt'
  $newFile = Join-Path $tmp 'garmin-dashboard.html'

  Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri "$base/SHA256SUMS.txt" -OutFile $sumsFile
  $want = $null
  foreach ($line in (Get-Content -LiteralPath $sumsFile)) {
    if ($line -match '^\s*([0-9a-fA-F]{64})\s+\*?garmin-dashboard\.html\s*$') { $want = $Matches[1].ToLower() }
  }
  if (-not $want) { throw 'no hash for garmin-dashboard.html in SHA256SUMS.txt' }

  $have = ''
  if (Test-Path -LiteralPath $env:HTML) { $have = (Get-FileHash -LiteralPath $env:HTML -Algorithm SHA256).Hash.ToLower() }
  if ($have -eq $want) {
    Write-Log 'up to date'
  } else {
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 60 -Uri "$base/garmin-dashboard.html" -OutFile $newFile
    $got = (Get-FileHash -LiteralPath $newFile -Algorithm SHA256).Hash.ToLower()
    if ($got -ne $want) { throw "hash mismatch: got $got, expected $want" }
    if (Test-Path -LiteralPath $env:HTML) {
      $prev = [IO.Path]::ChangeExtension($env:HTML, '.prev.html')
      Copy-Item -LiteralPath $env:HTML -Destination $prev -Force
    }
    Move-Item -LiteralPath $newFile -Destination $env:HTML -Force
    Write-Log "updated to $want"
  }
} catch {
  Write-Log ('update skipped: ' + $_.Exception.Message)
} finally {
  if ($tmp -and (Test-Path -LiteralPath $tmp)) { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}
