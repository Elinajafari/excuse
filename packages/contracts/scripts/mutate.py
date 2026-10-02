"""Mutation pass: break every defence on purpose, confirm a test notices.

Passing tests prove nothing on their own. Each entry below is a small edit to
the contract that removes a defence. The suite must fail for every one of them,
and this script records WHICH test caught it, so the table in the README is
measured rather than claimed.

    python scripts/mutate.py            # run them all, print what caught what
    python scripts/mutate.py --md       # emit the markdown table for the README

An escaping mutation is a finding, not a nuisance: either a missing test, or a
later defence strict enough that an earlier test can no longer fail. The script
exits non-zero if anything escapes, and refuses to run on a red baseline.

Three rules keep the harness honest:

  * the unmutated suite must be green before anything is mutated;
  * a find string that is missing, or matches more than once, is a failure of
    the harness, never a skip, so refactoring cannot quietly turn a row off;
  * scripts/lift.py runs inside every mutated copy before the suite, so the lib
    parity test can never stand in for the behavioural test a mutation deserves.
"""

import argparse
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).absolute().parent.parent
TARGET = "excuse.py"

FENCE = '    return str(raw).replace("<", "(").replace(">", ")").replace("[", "(").replace("]", ")")'

MUTATIONS = [
    # -- the grace window bounds rule() too (a steward review asked for this)
    ("a claim may be ruled on after its grace window closed",
     "        if self._now() > closes:", "        if False:"),
    ("the grace window for a ruling closes a second early",
     "        if self._now() > closes:", "        if self._now() >= closes:"),
    ("a late ruling is measured from the deadline alone, ignoring the grace",
     "        closes = int(o.due_at) + int(self.grace_seconds)", "        closes = int(o.due_at)"),

    # -- the answer: an index into the frozen list, or none
    ("a row number past the list is accepted",
     "    if k < 0 or k >= n:\n        return \"\"", "    if k < 0:\n        return \"\""),
    ("a word is read as a row number",
     '    if s == "" or any(ch not in "0123456789" for ch in s) or len(s) > 2:\n        return ""',
     '    if s == "":\n        return ""'),
    ("none is not recognised as an answer",
     "    if s == NONE:\n        return NONE\n", ""),
    ("the reversed row is not read back into the frozen order",
     "    return str(n - 1 - int(choice))", "    return str(choice)"),
    ("a disagreement between the orders keeps the forward excuse",
     "    return forward if forward == reverse_unreversed else NONE", "    return forward"),
    ("a disagreement between the orders keeps the reverse excuse",
     "    return forward if forward == reverse_unreversed else NONE", "    return reverse_unreversed"),
    ("the reversed pass is never asked",
     "            rev, _ = ask(title, duty, reversed_names, account, n)",
     "            rev = fwd if fwd == NONE else str(n - 1 - int(fwd))"),
    ("the second prompt is not reversed",
     "        reversed_names = list(reversed(names))", "        reversed_names = list(names)"),
    ("the row number is stored instead of the frozen excuse index",
     "            ruling = NONE if pos == NONE else str(asked[int(pos)])",
     "            ruling = pos"),

    # -- reading the model
    ("an unusable answer is not retried", "    for _ in range(2):", "    for _ in range(1):"),
    ("an unusable answer is read as none",
     '    raise gl.vm.UserError(f"{ERR_LLM} the model named no listed excuse and did not say none")',
     '    return NONE, ""'),
    ("an answer that is not an object crashes the block", "        if isinstance(raw, dict):", "        if True:"),

    # -- the validator
    ("the free structural layer is skipped",
     "            if not ruling_sound(proposed, asked):\n                return False\n            try:",
     "            try:"),
    ("a used excuse is sound",
     "    return int(s) in asked", "    return True"),
    ("a validator agrees with a leader that raised",
     "                # An [LLM_ERROR] is never agreed with.\n                return False",
     "                # An [LLM_ERROR] is never agreed with.\n                return True"),
    ("a validator trusts the leader",
     '            return excuse_agrees(mine["ruling"], proposed, asked)', "            return True"),
    ("a validator whose own model failed agrees",
     "            except gl.vm.UserError:\n                return False",
     "            except gl.vm.UserError:\n                return True"),
    ("agreement ignores soundness",
     "    return ruling_sound(mine, asked) and ruling_sound(theirs, asked) and str(mine) == str(theirs)",
     "    return str(mine) == str(theirs)"),
    ("the stored ruling is not checked against the excuses asked",
     "        if not ruling_sound(ruling, asked):\n            raise", "        if False:\n            raise"),

    # -- the deadline
    ("a granted excuse does not move the deadline",
     "            o.due_at = u256(int(o.due_at) + days * DAY)\n", ""),
    ("a granted excuse moves the deadline by seconds, not days",
     "            o.due_at = u256(int(o.due_at) + days * DAY)", "            o.due_at = u256(int(o.due_at) + days)"),
    ("an excuse can be used twice",
     "            e.used_by = u256(int(c.seq))\n", ""),
    ("used excuses are asked about again",
     "        return [k for k in range(int(o.n_excuses)) if int(self.excuses[first + k].used_by) == 0]",
     "        return [k for k in range(int(o.n_excuses))]"),
    ("the days granted are not recorded on the claim",
     "            c.days_granted = u256(days)\n", ""),
    ("a ruling leaves the claim pending",
     "        c.why = sanitise_reason(res.get(\"because\", \"\"))\n        o.pending = False",
     "        c.why = sanitise_reason(res.get(\"because\", \"\"))"),

    # -- claims
    ("anyone may claim", "        if who != o.obligor:", "        if False:"),
    ("a claim after the deadline is accepted",
     "        if now > int(o.due_at):\n            return f\"{ERR_EXPECTED} the deadline passed", "        if False:\n            return f\"{ERR_EXPECTED} the deadline passed"),
    ("a claim on the deadline is refused",
     "        if now > int(o.due_at):\n            return f\"{ERR_EXPECTED} the deadline passed", "        if now >= int(o.due_at):\n            return f\"{ERR_EXPECTED} the deadline passed"),
    ("a second claim may land while one waits",
     "        if bool(o.pending):\n            return f\"{ERR_EXPECTED} a claim is waiting", "        if False:\n            return f\"{ERR_EXPECTED} a claim is waiting"),
    ("claims are unlimited", "        if int(o.n_claims) >= MAX_CLAIMS:", "        if False:"),
    ("a claim is accepted with every excuse used", "        if len(self._unused(o)) == 0:", "        if False:"),
    ("the same account can be ruled on twice",
     "        if int(o.n_claims) > 0 and str(self.claims[int(o.last_claim)].digest) == h:", "        if False:"),
    ("a claim on a closed obligation is accepted",
     "        if str(o.status) != OPEN:\n            return f\"{ERR_EXPECTED} this obligation is {o.status}; nothing more can happen on it\"\n        if who",
     "        if who"),
    ("a claim does not mark the obligation as waiting",
     "        o.n_claims = u256(int(o.n_claims) + 1)\n        o.pending = True", "        o.n_claims = u256(int(o.n_claims) + 1)"),
    ("claims are not linked", "            self.claims[int(o.last_claim)].next = u256(idx)\n", ""),
    ("the account is unbounded",
     "        if len(body) < MIN_ACCOUNT or len(body) > MAX_ACCOUNT:", "        if False:"),

    # -- rule, fulfil, lapse
    ("anyone may ask for a ruling", "        if sender != o.obligee and sender != o.obligor:", "        if False:"),
    ("a ruling may run with nothing waiting",
     "        if str(o.status) != OPEN or not bool(o.pending):", "        if False:"),
    ("anyone may acknowledge the work", "        if gl.message.sender_address != o.obligee:", "        if False:"),
    ("the work can be acknowledged twice",
     "        if str(o.status) != OPEN:\n            raise gl.vm.UserError(f\"{ERR_EXPECTED} this obligation is {o.status}; nothing more can happen on it\")\n        o.status = KEPT",
     "        o.status = KEPT"),
    ("a breach is recorded before the deadline",
     "        if now <= int(o.due_at):\n            return f\"{ERR_EXPECTED} the deadline is", "        if False:\n            return f\"{ERR_EXPECTED} the deadline is"),
    ("a breach is recorded on the deadline itself",
     "        if now <= int(o.due_at):\n            return f\"{ERR_EXPECTED} the deadline is", "        if now < int(o.due_at):\n            return f\"{ERR_EXPECTED} the deadline is"),
    ("a waiting claim gives no protection",
     "        if bool(o.pending) and now <= int(o.due_at) + int(self.grace_seconds):", "        if False:"),
    ("a waiting claim protects forever",
     "        if bool(o.pending) and now <= int(o.due_at) + int(self.grace_seconds):", "        if bool(o.pending):"),
    ("a closed obligation can lapse",
     "    def _lapse_refusal(self, o, now: int) -> str:\n        \"\"\"Why lapse() would refuse right now, or \"\". lapse() raises it.\"\"\"\n        if str(o.status) != OPEN:",
     "    def _lapse_refusal(self, o, now: int) -> str:\n        \"\"\"Why lapse() would refuse right now, or \"\". lapse() raises it.\"\"\"\n        if False:"),
    ("a negative id reads the newest obligation",
     "        if i < 0 or i >= len(self.obligations):", "        if i >= len(self.obligations):"),

    # -- input bounds
    ("more than six excuses are accepted", "        if len(names) > MAX_EXCUSES:", "        if False:"),
    ("an excuse of any length is accepted",
     "            if len(name) < MIN_EXCUSE or len(name) > MAX_EXCUSE:", "            if False:"),
    ("two excuses with the same wording are accepted",
     "        if len(set(name.lower() for name in names)) != len(names):", "        if False:"),
    ("a mismatched list of days is accepted",
     "        if counts is None or len(counts) != len(names):", "        if counts is None:"),
    ("an excuse may be worth any number of days", "            if c < MIN_DAYS or c > MAX_DAYS:", "            if False:"),
    ("the obligee may be the obligor", "        if who == gl.message.sender_address:", "        if False:"),
    ("the deadline is unbounded", "        if window < MIN_WINDOW or window > MAX_WINDOW:", "        if False:"),
    ("the grace window is unbounded", "        if g < MIN_WINDOW or g > MAX_WINDOW:", "        if False:"),
    ("the duty is unbounded", "        if len(d) < MIN_DUTY or len(d) > MAX_DUTY:", "        if False:"),

    # -- the prompt boundary
    ("the fence is removed", FENCE, "    return str(raw)"),
    ("the fence leaves square brackets", FENCE, '    return str(raw).replace("<", "(").replace(">", ")")'),
    ("the fence deletes instead of replacing", FENCE,
     '    return str(raw).replace("<", "").replace(">", "").replace("[", "").replace("]", "")'),
    ("the account reaches the prompt unfenced", "{fence(account)}", "{account}"),
    ("the excuses reach the prompt unfenced",
     '    rows = "\\n".join(f"[{k}] {fence(excuses[k])}" for k in range(n))',
     '    rows = "\\n".join(f"[{k}] {excuses[k]}" for k in range(n))'),
    ("the obligation reaches the prompt unfenced", "{fence(title)}: {fence(duty)}", "{title}: {duty}"),
    ("the prompt no longer states the range",
     "Number of excuses: {n}. Answer with one number from 0 to {n - 1}, or none.", "Answer carefully."),
    ("the prompt no longer says the obligor's own trouble is not an excuse",
     "own delay, mistake, illness of its staff, or", "own delay or"),
    ("a leader's reason is stored as sent",
     '        c.why = sanitise_reason(res.get("because", ""))', '        c.why = str(res.get("because", ""))'),
    ("a leader's reason is stored uncapped",
     '    return " ".join("".join(out).split())[:limit]', '    return " ".join("".join(out).split())'),
]


PYTEST = [sys.executable, "-m", "pytest", "tests/", "-x", "-q", "--no-header", "-p", "no:cacheprovider"]


def copy_repo(tmp):
    dst = pathlib.Path(tmp) / "repo"
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns(
        "__pycache__", ".pytest_cache", ".git", "artifacts", "*.pyc", "node_modules", "deployments"))
    # tests/test_vectors.py and tests/test_shape.py read ../shared; a mutant
    # must face the same vectors and the same described surface.
    shared = pathlib.Path(tmp) / "shared"
    shared.mkdir()
    for name in ("excuse-vectors.json", "contract-shape.json"):
        shutil.copy(ROOT.parent / "shared" / name, shared / name)
    return dst


def run_one(label, find, replace):
    with tempfile.TemporaryDirectory() as tmp:
        dst = copy_repo(tmp)
        target = dst / TARGET
        src = target.read_text(encoding="utf-8")
        hits = src.count(find)
        if hits == 0:
            return "PATTERN NOT FOUND", None
        if hits > 1:
            return "PATTERN NOT UNIQUE", None
        target.write_text(src.replace(find, replace, 1), encoding="utf-8", newline="\n")
        subprocess.run([sys.executable, "scripts/lift.py"], cwd=dst, capture_output=True)
        proc = subprocess.run(PYTEST, cwd=dst, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
        if proc.returncode == 0:
            return "ESCAPED", None
        text = proc.stdout + proc.stderr
        m = re.search(r"^(?:FAILED|ERROR) (\S+?)::(\S+?)(?:\[|\s|$)", text, re.M)
        if m:
            return "caught", m.group(2).split("::")[-1]
        m = re.search(r"^E\s+(\w*(?:Error|Exception))", text, re.M)
        if m:
            return "caught", m.group(1) + " at import"
        return "caught", "unnamed failure"


def baseline_is_green():
    with tempfile.TemporaryDirectory() as tmp:
        dst = copy_repo(tmp)
        proc = subprocess.run(PYTEST, cwd=dst, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
        return proc.returncode == 0, (proc.stdout + proc.stderr)[-2000:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", action="store_true", help="emit the README table")
    args = ap.parse_args()

    green, tail = baseline_is_green()
    if not green:
        print("the unmutated suite is not green; every mutation would look caught:\n" + tail, file=sys.stderr)
        return 2

    rows, escaped = [], []
    for label, find, replace in MUTATIONS:
        status, test = run_one(label, find, replace)
        if status == "caught":
            rows.append((label, test))
            if not args.md:
                print("  caught   %-70s %s" % (label, test), flush=True)
        else:
            escaped.append((label, status))
            print("  %-8s %s" % (status, label), file=sys.stderr, flush=True)

    if args.md:
        print("| Mutation | Caught by |")
        print("|---|---|")
        for label, test in rows:
            print("| %s | `%s` |" % (label, test))
    else:
        print()
        print("  %d mutations, %d caught, %d escaped" % (len(MUTATIONS), len(rows), len(escaped)))
    return 1 if escaped else 0


if __name__ == "__main__":
    sys.exit(main())
