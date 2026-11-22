# jsal.ui updates: at each release

1. Draft it: `python -I .github/scripts/jsal_ui_updates_draft.py <version> v<previous>` prints an entry from the addon's commits (it writes nothing).
2. Read it through: one line for a feature built over several commits, the words a player would use, `new`/`better`/`fixed`/`out` right, the parts it couldn't place written in; remove every `"check"` (the build stops on one), set `restart`, add `"thanks"` for a player who found a fix.
3. Put it at the top of `jsal-ui-updates.json` with the tag's date (YYYY-MM-DD); a release made ahead of time waits in `jsal-ui-updates.next.json`, which the page never reads, until then.
4. Released versions only: a beta's version stops the build. The page is /jsal-ui/updates/; the build checks every entry.
5. It ships with the site like any other change; the hourly version Action keeps the jsal.ui page's version line and Latest card on its own.
