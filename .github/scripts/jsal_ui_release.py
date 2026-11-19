"""Writes src/data/jsal-ui-release.json from jsal.ui's latest GitHub release, for the jsal.ui page's version
line and its Latest release card: the version, the day it came out and its notes' bullets.

    python .github/scripts/jsal_ui_release.py release.json

release.json is GitHub's answer for the latest release (gh api repos/superjsal/jsal-ui/releases/latest).
The notes are short by rule (a title, then at most five one-line bullets); only the bullets are kept,
as plain text. Exits with an error, writing nothing, if the release doesn't look like one."""
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "data" / "jsal-ui-release.json"

release = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
version = release["tag_name"].removeprefix("v")
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    sys.exit(f"The latest release's tag isn't a version: {release['tag_name']!r}")
day = release["published_at"][:10]
notes = []
for line in (release.get("body") or "").splitlines():
    m = re.match(r"\s*[-*]\s+(.+)", line)
    if m:
        text = re.sub(r"\*\*|__|`", "", m.group(1))                    # bold and code marks
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text).strip()   # links keep their words
        notes.append(text)
if not notes:
    sys.exit("The latest release's notes have no bullets")
OUT.write_text(json.dumps({"version": version, "date": day, "notes": notes[:5]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{version} ({day}): {len(notes[:5])} notes")
