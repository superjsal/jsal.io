# Bumps the ?v= cache number on every page, so browsers fetch fresh CSS and JS after a change,
# and copies shell.css into every page. Run after editing shell.css, nav.js or an app's CSS/JS:
#   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\site\.github\build\bump-version.ps1
# Numbers are the date plus letters: 2026-10-28o → 2026-10-28p, …z → …za, or 2026-10-29a on a new day.
#
# shell.css is inlined (a <style data-jsal-shell> block in each page's <head>) rather than linked,
# so nothing blocks the first paint. Edit shell.css, never the copies: this script rewrites them,
# without the comments, and check.py fails if a copy no longer matches.
$site = Join-Path $PSScriptRoot "..\.." | Resolve-Path   # site\.github\build -> site\
$home_ = [IO.File]::ReadAllText((Join-Path $site "index.html"))
$old = [regex]::Match($home_, 'nav\.js\?v=([\w-]+)').Groups[1].Value
if (-not $old) { throw "Couldn't find the current ?v= number in index.html" }

$today = Get-Date -Format "yyyy-MM-dd"
if ($old -match "^$today([a-z]+)$") {
  # a → b … → z → za → zb …: only ever compared for equality, so any new string works
  $letters = $Matches[1]
  $last = $letters[-1]
  $new = if ($last -eq 'z') { $old + 'a' } else { $old.Substring(0, $old.Length - 1) + [char]([int][char]$last + 1) }
} else {
  $new = $today + "a"
}

# shell.css without comments, indentation or blank lines
$shell = [IO.File]::ReadAllText((Join-Path $site "shell.css"))
$shell = [regex]::Replace($shell, '/\*[\s\S]*?\*/', '')
$lines = $shell -split "\r?\n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }

$pages = Get-ChildItem $site -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\vendor\\|\\\.github\\build\\' }
foreach ($p in $pages) {
  $t = [IO.File]::ReadAllText($p.FullName)
  $before = $t
  $nl = if ($t.Contains("`r`n")) { "`r`n" } else { "`n" }
  $css = $lines -join $nl
  # A page still linking shell.css gets the block in the link's place (keeping its indent)
  $t = [regex]::Replace($t, '(?m)^([ \t]*)<link rel="stylesheet" href="/shell\.css[^"]*"\s*/?>', {
    param($m) $m.Groups[1].Value + '<style data-jsal-shell></style>'
  })
  $t = [regex]::Replace($t, '<style data-jsal-shell>[\s\S]*?</style>', {
    param($m) "<style data-jsal-shell>$nl$css$nl</style>"
  })
  $t = $t.Replace("v=$old", "v=$new")
  if ($t -ne $before) {
    [IO.File]::WriteAllText($p.FullName, $t)
    Write-Output "  $($p.FullName.Substring($site.Path.Length + 1))"
  }
}
# The apps' modules import each other with the same number (import "./state.js?v=…"), so a visitor
# never gets a new main.js with an old cached state.js. Every import of a file must match, or the
# browser loads two copies of it.
$scripts = Get-ChildItem $site -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch '\\vendor\\|\\\.github\\build\\' -and $_.DirectoryName -match '\\js$' }
foreach ($s in $scripts) {
  $t = [IO.File]::ReadAllText($s.FullName)
  $u = $t.Replace("v=$old", "v=$new")
  if ($u -ne $t) {
    [IO.File]::WriteAllText($s.FullName, $u)
    Write-Output "  $($s.FullName.Substring($site.Path.Length + 1))"
  }
}
Write-Output "$old -> $new"
