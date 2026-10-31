# Updates the ?v= cache numbers so browsers fetch fresh CSS and JS after a change. Run after editing
# shell.css, nav.js, favicon.svg, an app's CSS or JS, or cms-picker/quiz.json:
#   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\site\.github\build\bump-version.ps1
# Each file has its own number, the first 8 characters of a hash of its contents, so only the references to
# the files that changed are rewritten (every page, the apps' module imports, the publish template for the
# platform pages). The work is in versions.py next to this script; check.py uses the same code to fail a
# reference whose number is out of date.
python -I (Join-Path $PSScriptRoot "versions.py") @args
exit $LASTEXITCODE
