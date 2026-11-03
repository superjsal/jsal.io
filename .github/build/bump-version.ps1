# Updates the ?v= cache numbers in the apps' module imports ("./clean.js?v=…"), so browsers fetch fresh code after a
# change. Run after editing an app's JS module:
#   powershell -ExecutionPolicy Bypass -File C:\Users\JSAL\Desktop\jsal.io\.github\build\bump-version.ps1
# Each file has its own number, the first 8 characters of a hash of its contents, so only the references to the files
# that changed are rewritten. Pages need nothing: they're built from src\ and work out every number as they build
# (v() in src\lib\v.mjs). The work is in versions.py next to this script; check.py uses the same code to fail a
# reference whose number is out of date.
python -I (Join-Path $PSScriptRoot "versions.py") @args
exit $LASTEXITCODE
