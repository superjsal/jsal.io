# Updates the ?v= cache numbers so browsers fetch fresh CSS and JS after a change. Run after editing
# shell.css, nav.js, favicon.svg, an app's CSS or JS, or cms-picker/quiz.json:
#   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\.github\build\bump-version.ps1
# Each file has its own number, the first 8 characters of a hash of its contents, so only the references to
# the files that changed are rewritten (every page, the apps' module imports, the publish template for the
# platform pages). The work is in versions.py next to this script; check.py uses the same code to fail a
# reference whose number is out of date.
# The apps' import maps are inline scripts carrying those numbers, so the content security policy in
# site\_headers, which allows each inline script by its hash, is rewritten straight after (csp.py).
python -I (Join-Path $PSScriptRoot "versions.py") @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python -I (Join-Path $PSScriptRoot "csp.py")
exit $LASTEXITCODE
