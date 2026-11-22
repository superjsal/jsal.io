"""Draft a jsal.ui release's entry for the updates page (src/data/jsal-ui-updates.json), from the addon's commits.

Reads the commit subjects of the jsal-ui repo between the previous release's tag and this one (merges left out),
drops what a player never sees (version commits, betas, data refreshes, tooling), takes each line's part from the
subject's prefix before the colon ("Gear plan: ...") as the page names it, and guesses its kind: "out" and
"fixed" only on plain words for them, else "better" with "check" set, as is every line whose kind or part was a
guess. It prints the draft and writes nothing: John reads it, cuts it to what a player would notice (one line for
a feature built over several commits), fixes the words, and puts it at the top of the data file. A line still
carrying "check" stops the site's build, so none slips through unread.

    python -I .github/scripts/jsal_ui_updates_draft.py 0.3.61 v0.3.60
    python -I .github/scripts/jsal_ui_updates_draft.py 0.3.61 v0.3.60 --to beta --repo ../jsal-ui

--to is the end of the range (the release's tag, v<version>, unless given); --repo the addon's repo (beside this one).
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parents[2]

# A subject's prefix, as the addon's commits write it, to the part the page names. Several prefixes are one part.
PARTS = {
    "build planner": "Build Planner", "talent helper": "Talent helper", "training": "Training",
    "training panel": "Training", "training planner": "Training", "gear plan": "Gear plan", "gear": "Gear plan",
    "item tooltips": "Gear plan", "dungeon guide": "Dungeon guide", "dungeon map": "Dungeon guide",
    "professions": "Professions", "profession road": "Professions", "road": "Professions",
    "shopping list": "Shopping list", "crafting profit": "Crafting profit", "guild crafts": "Guild Crafts",
    "journal": "Journal", "home": "Home", "dashboard": "Dashboard", "settings": "Settings", "welcome": "Welcome",
    "games": "Games", "daily word": "Games", "icon guess": "Games", "pal run": "Games", "guild": "Guild",
    "pals": "Jsal's Pals", "jsal's pals": "Jsal's Pals", "food reminder": "Food reminder",
    "problem reports": "Report a problem", "report a problem": "Report a problem", "quest tags": "Quest tags",
    "quest tags on restedxp": "Quest tags", "layers": "Layers", "unlock mode": "Unlock Mode", "quick buttons": "Quick buttons",
    "flight bar": "Flight bar", "vendor run": "Vendor run", "waypoint": "Waypoint label", "add boxes": "Dashboard",
}
# What a player never sees: these subjects are dropped.
DROP = [
    re.compile(r"^jsal\.ui \d"),                       # a version's own commit
    re.compile(r"^\d+\.\d+\.\d+(-beta[.\d]*)?:"),        # a version's notes
    re.compile(r"\bbeta\b", re.I),
    re.compile(r"^Merge\b"),
    re.compile(r"^(Trainer prices|Gear data|Data|Tests?|Tools?|README|Long profession cooldowns|Raid night consumables)\b", re.I),
    re.compile(r"\b(monthly read|data refresh|rebake|gear data knows|lists read again)\b", re.I),
]
OUT = re.compile(r"\btaken out\b|\bremoved\b", re.I)
FIXED = re.compile(r"\bno longer\b|\bfixed\b|\bagain\b|\bisn't steered\b|\bstays? inside\b|\bfits\b", re.I)


def subjects(repo, start, end):
    out = subprocess.run(["git", "-C", str(repo), "log", "--no-merges", "--format=%s", f"{start}..{end}"],
                         capture_output=True, text=True, check=True).stdout
    return [s.strip() for s in out.splitlines() if s.strip()]


def sentence(text):
    """A subject's words as a sentence: its first letter a capital (past an opening quote), ending in a full stop."""
    text = text.strip().rstrip(".")
    m = re.search(r"[A-Za-z]", text)
    if m:
        text = text[:m.start()] + text[m.start()].upper() + text[m.start() + 1:]
    return text + "." if text else text


def draft(lines):
    changes, unknown, dropped = [], [], []
    for s in lines:
        if any(p.search(s) for p in DROP):
            dropped.append(s)
            continue
        prefix, _, rest = s.partition(":")
        part = PARTS.get(prefix.strip().lower()) if rest else None
        if not part:
            # No prefix, or one the page doesn't know: listed for a person, never guessed into a part
            unknown.append(s)
            continue
        if OUT.search(rest):
            kind, check = "out", None
        elif FIXED.search(rest):
            kind, check = "fixed", None
        else:
            kind, check = "better", "kind guessed: new or better?"
        change = {"kind": kind, "part": part, "text": sentence(rest)}
        if check:
            change["check"] = check
        changes.append(change)
    return changes, unknown, dropped


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("version")
    ap.add_argument("previous", help="the previous release's tag, e.g. v0.3.60")
    ap.add_argument("--to", help="the end of the range (default v<version>)")
    ap.add_argument("--repo", default=str(HERE.parent / "jsal-ui"))
    a = ap.parse_args()
    if "beta" in a.version:
        sys.exit("A beta never goes on the updates page: give the release's version.")
    changes, unknown, dropped = draft(subjects(a.repo, a.previous, a.to or f"v{a.version}"))
    entry = {"version": a.version, "date": "YYYY-MM-DD (the tag's day)", "restart": False, "changes": changes}
    print(json.dumps(entry, indent=2, ensure_ascii=False))
    print(f"\n{len(changes)} lines drafted, {sum(1 for c in changes if 'check' in c)} with a guessed kind to check;"
          " set restart if the version's files changed (ns.restartSince is this version).", file=sys.stderr)
    if unknown:
        print("\nNo part known for these: write them in by hand, or add the prefix to PARTS:", file=sys.stderr)
        for s in unknown:
            print("  " + s, file=sys.stderr)
    if dropped:
        print(f"\nLeft out ({len(dropped)}): " + "; ".join(dropped), file=sys.stderr)


if __name__ == "__main__":
    main()
