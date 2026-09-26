"""
The demo, replayed offline.

scripts/seed.mjs puts the demo on StudioNet from demo/demo.json. This file
replays the same steps through the real contract in the simulator, so a demo
that could not succeed is caught before a transaction is spent on it.

When deployments/studionet.json exists, the replay goes further: it feeds the
simulator the rulings the validators actually agreed on, and checks that this
repository's contract moves the deadline exactly as the deployed one did and
refuses exactly where it refused.

    pytest tests/test_runbook.py -v
"""

import hashlib
import json
import pathlib

import pytest

import glsim as S

CONTRACT_PATH = "excuse.py"
M = S.load_contract(CONTRACT_PATH)
RECORD = pathlib.Path("deployments/studionet.json")

import demo as D  # noqa: E402

WHO = {"obligee": "0x" + "a1" * 20, "obligor": "0x" + "b2" * 20, "stranger": "0x" + "c3" * 20}
T0 = 1_790_000_000

OPEN0 = [D.TITLE, D.DUTY, WHO["obligor"], D.DUE_IN, D.joined(D.EXCUSES), D.joined(D.DAYS)]
OPEN1 = [D.SHORT_TITLE, D.SHORT_DUTY, WHO["obligor"], D.SHORT_DUE_IN, D.joined(D.EXCUSES), D.joined(D.DAYS)]

# As scripts/seed.mjs sends them: who, method, arguments, expected outcome.
STEPS = [
    ("obligee", "open", OPEN0, "ok"),
    ("obligee", "open", OPEN1, "ok"),
    ("stranger", "lapse", [1], "refused"),
    ("stranger", "claim", [0, D.STRIKE], "refused"),
    ("obligor", "claim", [0, D.STRIKE], "ok"),
    ("obligor", "claim", [0, D.ILLNESS], "refused"),
    ("stranger", "rule", [0], "refused"),
    ("obligee", "rule", [0], "ok"),
    ("obligor", "claim", [0, D.STRIKE], "refused"),
    ("obligor", "claim", [0, D.ILLNESS], "ok"),
    ("obligor", "rule", [0], "ok"),
    ("obligor", "claim", [0, D.THIRD], "refused"),
    ("obligee", "fulfil", [0], "ok"),
    ("stranger", "lapse", [1], "ok"),
]


def replay(rulings):
    """Run STEPS. `rulings` are the frozen excuse indices (or "none") the two
    ok rule steps come back with, in order."""
    c = S.deploy(CONTRACT_PATH, D.GRACE_SECONDS)
    outcomes = []
    clock = T0
    queue = list(rulings)
    for actor, method, args, expect in STEPS:
        clock += 30
        if method == "lapse" and expect == "ok":
            clock = T0 + 10_000
        S.set_time(M.iso(clock))
        S.set_mocks()
        if method == "rule" and expect == "ok":
            o = c.obligations[0]
            asked = [k for k in range(o.n_excuses) if c.excuses[o.first_excuse + k].used_by == 0]
            names = [c.excuses[o.first_excuse + k].text for k in asked]
            want = queue.pop(0)
            fwd = "none" if want == "none" else str(asked.index(int(want)))
            rev = "none" if want == "none" else str(len(asked) - 1 - int(fwd))
            S.set_mocks(leader_prompts={"<excuses>\n[0] " + names[0]: {"excuse": fwd, "because": "replayed"},
                                        "<excuses>\n[0] " + names[-1]: {"excuse": rev, "because": "replayed"}})
        S.set_sender(WHO[actor])
        try:
            S.call(c, method, *args)
            outcomes.append(("ok", ""))
        except S.UserError as e:
            outcomes.append(("refused", e.message))
    return c, outcomes


class TestDemoData:
    def test_every_string_the_demo_sends_passes_the_bounds(self):
        for name in D.EXCUSES:
            assert M.MIN_EXCUSE <= len(name) <= M.MAX_EXCUSE and "|" not in name
        assert M.parse_days(D.joined(D.DAYS)) == D.DAYS
        for account in (D.STRIKE, D.ILLNESS, D.THIRD):
            assert M.MIN_ACCOUNT <= len(M.clean_text(account)) <= M.MAX_ACCOUNT
        for duty in (D.DUTY, D.SHORT_DUTY):
            assert M.MIN_DUTY <= len(duty) <= M.MAX_DUTY

    def test_the_strike_claim_is_in_the_words_of_the_first_excuse(self):
        """Say it in the words the prompt asks in: the account names a strike
        that stopped carriers on the route, which is what excuse 0 lists."""
        for word in ("strike", "carrier", "route"):
            assert word in D.STRIKE.lower() and word in D.EXCUSES[0]

    def test_the_illness_claim_is_the_obligor_s_own_trouble(self):
        assert "ill" in D.ILLNESS and "illness of its staff" in M.build_prompt("t", "d", D.EXCUSES, "a", 3)

    def test_the_short_deadline_outlasts_the_step_that_is_meant_to_find_it_open(self):
        """The early lapse is the third transaction; at the 40 s per
        transaction measured on StudioNet it lands long before five minutes."""
        assert D.SHORT_DUE_IN >= 3 * 40 * 2


class TestReplay:
    def test_the_demo_succeeds_and_refuses_exactly_where_it_says(self):
        _, outcomes = replay(D.EXPECTED_RULINGS)
        assert [o for o, _ in outcomes] == [s[-1] for s in STEPS]

    def test_the_refusals_say_why(self):
        _, outcomes = replay(D.EXPECTED_RULINGS)
        msgs = [m for o, m in outcomes if o == "refused"]
        for msg, want in zip(msgs, ["the deadline is", "only the obligor", "waiting for its ruling",
                                    "only the obligee or the obligor", "already ruled on", "at most 2 claims"]):
            assert want in msg, (want, msg)

    def test_the_expected_rulings_move_the_deadline_by_three_days(self):
        c, _ = replay(D.EXPECTED_RULINGS)
        assert c.obligation(0)["days_extended"] == 3 and c.status(0) == "kept"
        assert [r["ruling"] for r in c.claims_of(0)["claims"]] == ["0", "none"]
        assert c.status(1) == "breached"


@pytest.mark.skipif(not RECORD.exists(), reason="no deployment recorded yet: pnpm deploy:contract && pnpm seed:contract")
class TestTheRecord:
    def _record(self):
        return json.loads(RECORD.read_text(encoding="utf-8"))

    def test_the_record_is_of_this_source(self):
        here = hashlib.sha256(pathlib.Path(CONTRACT_PATH).read_bytes().replace(b"\r\n", b"\n")).hexdigest()
        assert self._record()["source_sha256"] == here, "the deployed contract is not this file; redeploy"

    def test_every_step_on_chain_did_what_the_demo_expected(self):
        steps = [s for s in self._record()["steps"] if s["step"] != "deploy"]
        assert [("ok" if s["ok"] else "refused") for s in steps] == [s[-1] for s in STEPS]

    def test_this_contract_moves_the_deadline_as_the_deployed_one_did(self):
        rec = self._record()
        rulings = [c["ruling"] for c in rec["obligations"][0]["claims"] if c["ruled"]]
        c, outcomes = replay(rulings)
        assert [o for o, _ in outcomes] == [s[-1] for s in STEPS]
        for k, o in enumerate(rec["obligations"]):
            mine = c.obligation(k)
            assert mine["status"] == o["obligation"]["status"]
            assert mine["days_extended"] == o["obligation"]["days_extended"]
            assert [x["used_by"] for x in c.excuses_of(k)["excuses"]] == [x["used_by"] for x in o["excuses"]]
            assert [(x["ruling"], x["days_granted"]) for x in c.claims_of(k)["claims"]] == \
                [(x["ruling"], x["days_granted"]) for x in o["claims"]]
