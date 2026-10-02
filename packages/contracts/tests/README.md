# Contract tests

Excuse is tested at four levels, from the cheapest to the one that costs real
transactions. Each level has one command.

| Level | Command | Needs | What it proves |
|---|---|---|---|
| 1. Offline suite | `pnpm test:contract` | Python + pytest | the contract file itself behaves as specified, including against a lying leader and a moving clock |
| 2. Mutation pass | `pnpm mutate:contract` | same | every defence is covered by a test that fails without it |
| 3. Live demo | `pnpm deploy:contract && pnpm seed:contract` | Node 20+ | the same behaviour happens on StudioNet, with real validators, real models and the chain's own clock |
| 4. Chain checks | `pnpm e2e:contract`, `pnpm verify:contract`, `pnpm evidence:contract` | Node 20+ | what the record claims is what the chain holds, and what is deployed is this file |

## 1. The offline suite

```bash
pip install -r requirements-dev.txt
pnpm test:contract   # from the repo root, or here: python -m pytest tests -q
```

It runs the real `packages/contracts/excuse.py` on [`tests/glsim.py`](glsim.py), a
small GenVM stand-in. The stand-in gives the leader and each validator their own
mock model answers, can make a leader lie, sets the transaction time the
contract reads, and refuses what GenVM refuses, such as a storage field of a
type GenVM cannot store.

| File | What it covers |
|---|---|
| [`test_logic.py`](test_logic.py) | the pure rules: time parsing, address checks, the pipe-joined lists (an empty excuse is kept, so the days never shift), whole days, reading a model's answer, reading the reversed answer back, the fold of the two orders, the structural check, the agreement, the fence, and that `lib/excuse_consensus.py` is exactly the contract's code |
| [`test_e2e.py`](test_e2e.py) | the contract executed: `open` and its bounds; `claim` (obligor only, before the deadline, one at a time, at most two, never the same account twice); `rule` (a listed excuse moves the deadline by its frozen days, `none` moves nothing, each excuse used once, only unused ones asked, an order-dependent answer is `none`, a lying or malformed leader is refused, a malformed one for free, an `[LLM_ERROR]` is never agreed with); `fulfil` and `lapse` (the breach moves with a granted excuse, a claim in time protects until its ruling or the grace window); and static checks over the parsed source (runner pinned, class named after the product, pure ASCII, storage types, the block never touches storage, prompts only inside the block, every gated write checks its sender) |
| [`test_runbook.py`](test_runbook.py) | the live demo replayed offline from [`demo/demo.json`](../demo/demo.json), with the clock moved past the short deadline, before any transaction is spent; and once `deployments/studionet.json` exists, the validators' real rulings are replayed through this file, which must move every deadline exactly as the deployed contract did |
| [`test_vectors.py`](test_vectors.py) | `packages/shared/excuse-vectors.json` is exactly what this contract's text cleaning, list and day parsing, answer reading, order folding and structural check compute, so the TypeScript port in `packages/shared` is tested against the contract's own answers (`UPDATE_VECTORS=1` regenerates it) |
| [`test_shape.py`](test_shape.py) | `packages/shared/contract-shape.json` describes every public write and view, its parameters and types, and the fields the live deployment returned, exactly; any drift on either side fails |

The last group, `TestTheRecord`, is skipped until a deployment has been
recorded, and then runs every time.

## 2. The mutation pass

```bash
pnpm mutate:contract
```

[`scripts/mutate.py`](../scripts/mutate.py) makes 65 small edits to a copy of the
contract, each one removing a defence ("a claim after the deadline is
accepted", "a validator trusts the leader", "an excuse can be used twice",
"anyone may acknowledge the work", ...), runs the suite against each, and names
the test that failed. A mutant that survives is a missing test, and the script
exits non-zero. It refuses to run on a red baseline, and a mutation whose target
text is missing or ambiguous is a failure, never a skip. The table in the
README is its output.

## 3. The live demo

```bash
pnpm install
pnpm deploy:contract          # a fresh deployer wallet deploys packages/contracts/excuse.py, grace window 300 s
pnpm seed:contract            # a fresh obligee, obligor and stranger run the demo
```

Four wallets, one role each, all made in memory for the run:

| Wallet | Does |
|---|---|
| deployer | deploys the contract, nothing else |
| obligee | opens both obligations, asks for the first ruling, acknowledges the work, asks for a ruling too late |
| obligor | files the claims, asks for the second ruling, tries the claims it may not make |
| stranger | tries to claim, to rule and to lapse early, then records the real breach, which anyone may |

Obligation 0 is a catalogue delivery due in an hour with three excuses: a
strike that stops carriers (3 days), a public authority's order (2 days), and a
fire, flood or storm (5 days). Obligation 1 has the same excuses and is due in
five minutes; the obligor claims on it in time, and nobody asks for the ruling
until the grace window has closed.

Every transaction, in order, and what it proves. The expected outcome is part
of the script: if the chain does anything else, the run stops, because the
record claims whatever it holds.

| # | Sent by | Call | Expected | What it proves |
|---|---|---|---|---|
| 0 | deployer | deploy (grace 300 s) | deployed | the file deploys as it is; its sha256 is recorded |
| 1 | obligee | `open` obligation 0 | executed | three excuses and their days are frozen |
| 2 | stranger | `claim(0, strike)` | refused | only the obligor may claim |
| 3 | obligor | `claim(0, strike)` | executed | the account is on the record, with the chain's time, before any model reads it |
| 4 | obligor | `claim(0, illness)` | refused | one claim at a time |
| 5 | stranger | `rule(0)` | refused | only the parties may ask for a ruling |
| 6 | obligee | `rule(0)` | **excuse 0, +3 days** | validators, in both orders, name the strike excuse; the deadline moves by its frozen 3 days |
| 7 | obligor | `claim(0, strike)` again | refused | an account already ruled on cannot be filed again |
| 8 | obligor | `claim(0, illness)` | executed | the second and last claim |
| 9 | obligor | `rule(0)` | **none, +0 days** | the obligor's own staff illness is no listed excuse; only the unused excuses were asked |
| 10 | obligor | `claim(0, third)` | refused | at most two claims |
| 11 | obligee | `fulfil(0)` | **kept** | the obligee acknowledges the work |
| 12 | obligee | `open` obligation 1 | executed | a five-minute deadline starts |
| 13 | stranger | `lapse(1)` | refused | a breach cannot be recorded before the deadline |
| 14 | obligor | `claim(1, wind)` | executed | a claim filed in time; nobody asks for its ruling |
| 15 | stranger | `lapse(1)` after the deadline | refused | the claim filed in time protects the obligation while its grace window runs |
| 16 | obligee | `rule(1)` after the grace window | **refused** | the claim expired with its grace window: no late ruling can extend the deadline, and no model is asked |
| 17 | stranger | `lapse(1)` | **breached** | the only route left; anyone may record what the clock implies |

Before step 15 the script reads obligation 1's deadline from the chain and
waits until it has passed by 20 seconds; before step 16, the same for the end
of its grace window. The seed then reads every obligation,
excuse and claim back from the chain into
[`deployments/studionet.json`](../deployments/studionet.json).

## 4. Checking the chain, not the record

```bash
pnpm e2e:contract             # PASS/FAIL per check
pnpm verify:contract          # the deployed source, byte for byte, and genvm-lint on it
pnpm evidence:contract        # EVIDENCE.md
```

- **`e2e`** fetches every recorded transaction again and checks that the chain
  still says what the record says (executed, or refused with the same
  sentence), then re-reads every obligation, excuse and claim. Both demo
  obligations are closed, so nothing on them can change and every field must
  match exactly.
- **`verify`** reads the deployed source back with `gen_getContractCode`,
  compares it byte for byte with `packages/contracts/excuse.py`, and runs genvm-lint on
  the bytes that came off the chain (pinned to GenVM `v0.3.0-rc7`).
- **`evidence`** builds [EVIDENCE.md](../../../EVIDENCE.md) from the chain's answers
  alone: for each hash the sender, the status and the outcome, plus a table of
  the wallets and how many transactions each sent. A row whose on-chain
  outcome disagrees with the record is marked.

A refusal still reaches ACCEPTED or FINALIZED: the committee agreed that the
contract refused. That is why every script reads the leader's result (`return`
or `rollback`) and never treats the status alone as success.

## Measuring

```bash
pnpm measure:contract
```

Runs the suite and the mutation pass now and renders their numbers, and the
live record, into the README. It writes nothing if the suite is red, a mutant
escapes, or the record is of a different contract file.
