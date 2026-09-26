"""The demo's data, loaded from demo/demo.json.

scripts/seed.mjs sends exactly these strings to StudioNet, and
tests/test_runbook.py replays them offline, so the demo on the explorer and the
demo the tests check cannot drift apart.

One obligation, three excuses agreed in advance, two claims. The first claim
describes an event the list names (a strike that stops carriers), so the
deadline moves by that excuse's days. The second describes the obligor's own
problem (its staff fell ill), which the list does not name, so nothing moves.
A second obligation is never claimed on, and lapses into breach.
"""

import json
import pathlib

_DATA = json.loads((pathlib.Path(__file__).absolute().parent.parent / "demo" / "demo.json").read_text(encoding="utf-8"))

GRACE_SECONDS = _DATA["grace_seconds"]

TITLE = _DATA["obligation"]["title"]
DUTY = _DATA["obligation"]["duty"]
EXCUSES = _DATA["obligation"]["excuses"]
DAYS = _DATA["obligation"]["days"]
DUE_IN = _DATA["obligation"]["due_in"]

STRIKE = _DATA["claims"]["strike"]
ILLNESS = _DATA["claims"]["illness"]
THIRD = _DATA["claims"]["third"]

SHORT_TITLE = _DATA["short_obligation"]["title"]
SHORT_DUTY = _DATA["short_obligation"]["duty"]
SHORT_DUE_IN = _DATA["short_obligation"]["due_in"]

# (expected ruling as the frozen excuse index, or "none") per claim
EXPECTED_RULINGS = _DATA["expected_rulings"]


def joined(items):
    return "|".join(str(x) for x in items)
