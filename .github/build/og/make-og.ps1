# Renders the link-preview images and the home-screen icon with headless Edge.
# Run from anywhere:  powershell -File C:\Users\JSAL\Desktop\jsal.io\.github\build\og\make-og.ps1
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$here = $PSScriptRoot
$site = Join-Path $here "..\..\..\site" | Resolve-Path   # .github\build\og -> site\
New-Item -ItemType Directory -Force (Join-Path $site "og") | Out-Null
$tpl = "file:///" + ((Join-Path $here "og.html") -replace '\\', '/')

function Shot($url, $out, $w, $h) {
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
    --virtual-time-budget=6000 --window-size="$w,$h" --screenshot="$out" $url 2>$null | Out-Null
  Write-Output "$out  $((Get-Item $out).Length) bytes"
}

foreach ($p in "home", "image-resizer", "formatter", "redirects", "cms-picker", "play") {
  Shot "$($tpl)?p=$p" (Join-Path $site "og\$p.png") 1200 628
}
$icon = "file:///" + ((Join-Path $here "icon.html") -replace '\\', '/')
Shot $icon (Join-Path $site "apple-touch-icon.png") 180 180
Shot $icon (Join-Path $site "icon-192.png") 192 192
Shot $icon (Join-Path $site "icon-512.png") 512 512

# One per CMS Picker platform page (og/cms-picker-<id>.png), from the published answers: the platform's name
# and its six SEO tags. Text only, no logos. Re-run after a platform is added or an SEO tag changes; a page
# without its own image uses og/cms-picker.png (playbook.py platform pages).
$data = Get-Content (Join-Path $site "cms-picker\data.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$rows = "meta_title", "urls", "gsc404", "schema", "noindex", "ai_crawlers"
foreach ($p in $data.platforms) {
  if (-not $p.profile) { continue }
  $a = $data.answers.($p.id)
  $tags = ($rows | ForEach-Object { $a.$_.verdict }) -join ","
  $where = @($rows | Where-Object { $a.$_.where }).Count -gt 0
  $q = "p=platform&name=$([uri]::EscapeDataString($p.name))&tags=$tags" + $(if ($where) { "" } else { "&how=1" })
  Shot "$($tpl)?$q" (Join-Path $site "og\cms-picker-$($p.id).png") 1200 628
}

# The brand kit (.github/brand/kit/, not served) from kit.html: the LinkedIn banner, the GitHub social preview, an avatar,
# the tool icons and the email signature's lockups. Icons and signatures keep a transparent background.
$kitDir = Join-Path $here "..\..\brand\kit"
New-Item -ItemType Directory -Force $kitDir | Out-Null
$kit = "file:///" + ((Join-Path $here "kit.html") -replace '\\', '/')
function ShotClear($url, $out, $w, $h) {
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 `
    --virtual-time-budget=6000 --window-size="$w,$h" --screenshot="$out" $url 2>$null | Out-Null
  Write-Output "$out  $((Get-Item $out).Length) bytes"
}
Shot "$($kit)?p=linkedin" (Join-Path $kitDir "linkedin-banner.png") 1584 396
Shot "$($kit)?p=github" (Join-Path $kitDir "github-social-preview.png") 1280 640
Shot "$($kit)?p=avatar" (Join-Path $kitDir "avatar-800.png") 800 800
foreach ($t in "cms-picker", "clean-paste", "image-resizer", "platform-playbook") {
  ShotClear "$($kit)?p=icon&t=$t" (Join-Path $kitDir "tool-$t-512.png") 512 512
}
ShotClear "$($kit)?p=signature&theme=light" (Join-Path $kitDir "signature-light.png") 369 112
ShotClear "$($kit)?p=signature&theme=dark" (Join-Path $kitDir "signature-dark.png") 369 112
