# Pre-push checks for the site (see check.py for the list). Run before every push:
#   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\site\.github\build\check.ps1
# When the local server is running (the jsal-site preview, port 8765) and Playwright is installed here
# (npm ci in this folder), it also runs axe on every page (browser-check.mjs --axe, about 20 seconds);
# otherwise that part is skipped.
python -I (Join-Path $PSScriptRoot "check.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$up = $false
try { $up = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 http://localhost:8765/).StatusCode -eq 200 } catch {}
if ($up -and (Test-Path (Join-Path $PSScriptRoot "node_modules\playwright"))) {
  Push-Location $PSScriptRoot
  node browser-check.mjs --axe | Select-String -Pattern "axe .*: (serious|critical)|problem\(s\)|couldn't start|passed"
  $code = $LASTEXITCODE
  Pop-Location
  exit $code
}
Write-Output "Accessibility (axe): skipped, the local server isn't running."
exit 0
