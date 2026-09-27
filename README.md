# Excuse

**Deadlines with their force majeure clause built in, on GenLayer.** The name
is the promise: a deadline moves only for an excuse that was agreed before
anything happened, and only by the days that excuse was agreed to buy.

The party owed the work opens an obligation with a due date and a short list
of excuses, each worth a fixed number of days: "a strike that stops carriers on
the route: 3 days". The party who owes the work may claim, before the deadline,
that an event happened. GenLayer's validators decide one thing: which listed
excuse the account describes, or none. The contract moves the deadline by that
excuse's frozen days, each excuse can be used once, and anyone can record the
breach once the deadline has really passed.

**Live on studionet at `0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E`.**
Intelligent contract + shared type layer + scripts that deploy, seed, verify
and prove it, not a standalone contract.

> Every transaction of the live demo, and the wallet that sent it, read back
> from the chain: **[EVIDENCE.md](EVIDENCE.md)**.
> A second round from two new wallets: **[EVIDENCE-ACTIVITY.md](EVIDENCE-ACTIVITY.md)**.

---

## Why this exists

Every force majeure argument has the same shape. Something happened; one side
says it is covered, the other says it is not; and whoever decides is also
deciding how late is acceptable. Small suppliers, freelancers and event
vendors lose that argument by default: the party with the money decides, and
nobody goes to court over a three-day slip on a print order.

Asking a model "should the deadline be extended?" does not fix it either. It
hands the model both questions at once and gets back a number of days nobody
ever agreed to.

### In plain terms

Before any work starts, the client writes the deadline and a short list of
acceptable excuses into the contract, each with the days it buys. Those are
frozen. If something happens, the supplier writes what happened, in their own
words, before the deadline. The validators each read that account against the
list, twice, in two different orders, and have to agree exactly on which
excuse it is, or that it is none. If it is one of them, the deadline moves by
that excuse's days; if not, nothing moves. When the work is done the client
marks it kept. If the deadline passes with nothing done, anyone can record the
breach, and a payment or penalty contract can read it in one word.

Nobody has to trust the other party's reading of events at any point.

### Why this needs GenLayer specifically

Whether "a national port strike stopped every carrier on the route" is an
instance of "a strike or blockade that stops carriers serving the delivery
route", and whether "our print supervisor was ill" is not, is a judgment about
natural language. A normal smart contract cannot make it. An LLM can, but a
single model run by one party is not a ruling the other party has to accept.

Here the reading is done by a validator quorum under consensus rules, and the
deadline moves on the same chain as the contracts that depend on it. Everything
that is not a judgment is kept away from the model: the days were fixed in
advance, the answer is an index into a list the contract already holds, and an
excuse that only fits when it is listed first is recorded as none. A model
answer that cannot be parsed fails closed: it is raised as `[LLM_ERROR]`, which
no validator agrees with, so a broken model can never move a deadline.

### How you actually use it

1. **Open an obligation** (the obligee): `open(title, duty, obligor, due_in,
   excuses, days)` with the excuses and their days joined by `|`. You are
   recorded as the obligee; the excuses and days are frozen.
2. **Claim an excuse** (the obligor, before the deadline): `claim(id,
   account)` with what happened, in plain words. At most two claims, one at a
   time.
3. **Get the ruling** (either party): `rule(id)`. Validators name the excuse or
   none, and the deadline moves by that excuse's days.
4. **Close it**: the obligee calls `fulfil(id)` when the work is done; after
   the deadline (and the grace window, if a claim is waiting), anyone may call
   `lapse(id)` to record the breach.
5. **Rely on it from another contract**: `status(id)` returns one word:
   `open`, `kept` or `breached`.

   ```python
   excuse = gl.get_contract_at(Address(EXCUSE))
   if excuse.view().status(obligation_id) == "breached":
       ...  # apply the late-delivery penalty the agreement names
   ```

## Stack

| Layer | Tech |
|---|---|
| Contract | GenLayer Intelligent Contract, Python (GenVM): [`packages/contracts/excuse.py`](packages/contracts/excuse.py) |
| Consensus | custom leader/validator with `gl.vm.run_nondet_unsafe`: a free structural check, then exact agreement on the frozen excuse index |
| Tests | pytest on a GenVM stand-in that runs the real file and moves the chain's clock, plus a mutation pass that breaks every defence on purpose |
| Chain client | `genlayer-js` 1.1.8: deploy, seed, e2e, verify and evidence scripts |
| Types | [`packages/shared`](packages/shared): view types, parsers and a port of the contract's deterministic rules, tested against vectors generated from the contract |

There is no backend and no database. Every value in this repository's record
was read back from the chain.

---

## Quick start

```bash
pnpm install
pip install -r packages/contracts/requirements-dev.txt

pnpm test               # contract (pytest) + shared (vitest), no chain needed
```

Deploy your own copy and put the whole demo on the explorer:

```bash
pnpm deploy:contract    # a fresh deployer wallet deploys packages/contracts/excuse.py (grace window 300 s)
pnpm seed:contract      # 2 obligations, 2 claims, 2 rulings, kept + breached, 6 refusals, from three more wallets
pnpm e2e:contract       # re-reads every transaction and every view: PASS/FAIL
pnpm evidence:contract  # rewrites EVIDENCE.md from the chain
```

| Command | What it does |
|---|---|
| `pnpm test` | contract and shared suites |
| `pnpm test:contract` | pytest against `excuse.py`, no chain needed |
| `pnpm test:shared` | vitest: the TypeScript port against the contract's vectors, and the parsers against the live record |
| `pnpm typecheck` | `tsc --noEmit` on the shared package |
| `pnpm mutate:contract` | removes every defence one at a time; every mutant must be caught by a named test |
| `pnpm measure:contract` | runs the suite and the mutation pass and renders the numbers into the contract README |
| `pnpm lint:genvm` | GenVM linter on the contract, pinned to the runner it depends on |
| `pnpm deploy:contract` | deploy to studionet (a throwaway deployer key) |
| `pnpm seed:contract` | the demo: every route and every refusal, recorded; waits about five minutes so the breach is real |
| `pnpm seed:activity` | a second round on the deployed contract from two new wallets, recorded apart from the demo |
| `pnpm e2e:contract` | the record checked against the live chain |
| `pnpm verify:contract` | the deployed source, byte for byte against the file, and linted |
| `pnpm evidence:contract` | EVIDENCE.md: every transaction and its sender, from the chain |
| `pnpm evidence:activity` | EVIDENCE-ACTIVITY.md: the second round, from the chain |
| `pnpm demo:contract` | deploy, seed, e2e and evidence in one go |

### Configuration

Copy `.env.example` to `.env`. On studionet nothing is needed: every role gets
a wallet made in memory for the run, and no key is ever written to disk. On any
other network (`GENLAYER_NETWORK=testnet-asimov`) the scripts refuse to run
without `DEPLOYER_PRIVATE_KEY`, `OBLIGEE_PRIVATE_KEY`, `OBLIGOR_PRIVATE_KEY`
and `STRANGER_PRIVATE_KEY`.

## The live demo

Obligation 0 is a catalogue delivery for a trade fair, due in an hour, with
three excuses: a strike that stops carriers (3 days), a public authority's
order (2 days), and a fire, flood or storm (5 days). Obligation 1 has the same
excuses and is due in five minutes.

| Claim | Ruling | Deadline |
|---|---|---|
| "A national port strike began on 3 March and stopped every carrier serving the Rotterdam delivery route for two days" | **excuse 0**, both orders | **+3 days** |
| "Our print supervisor was ill for a week" | **none**: the obligor's own trouble is no listed excuse | +0 days |

Obligation 0 ends **kept**; obligation 1, never claimed on, ends **breached**
once its deadline has passed. Around them, six refusals, each from the wallet
it is about: a breach recorded too early, a stranger claiming, a second claim
while one waits, a stranger asking for a ruling, the same account filed again,
and a third claim. Full detail, with every hash: [EVIDENCE.md](EVIDENCE.md)
and [`packages/contracts/README.md`](packages/contracts/README.md#verified-against-the-live-deployment).

### Second round, two new wallets

`pnpm seed:activity` ran on the same contract from two wallets that had never
been used: a new obligee opened obligation 2 (printed menus for a festival,
the same three excuses), its attempt to claim an excuse itself was refused, the
new obligor claimed that a storm flooded the print works, the validators ruled
**excuse 2 (fire, flood or storm)** in both orders and the deadline moved
**+5 days**, the obligor's attempt to acknowledge its own work was refused, and
the obligee marked it **kept**. Every hash: [EVIDENCE-ACTIVITY.md](EVIDENCE-ACTIVITY.md).

## Repo layout

```
.
├─ packages/
│  ├─ contracts/                 the Intelligent Contract and everything that proves it
│  │  ├─ excuse.py               the contract
│  │  ├─ tests/                  pytest on a GenVM stand-in (see tests/README.md)
│  │  ├─ scripts/                deploy · seed · e2e · verify · evidence · lint · mutate · measure
│  │  ├─ demo/demo.json          the demo, read by the seed script AND the tests
│  │  ├─ deployments/            studionet.json, written by the scripts, never by hand
│  │  ├─ lib/                    the ruling rules, generated from the contract
│  │  └─ DECISIONS.md            why every rule is the way it is
│  └─ shared/                    types, parsers, contract-shape.json, the rules port and its vectors
├─ EVIDENCE.md                   every live transaction and its sender
├─ EVIDENCE-ACTIVITY.md          the second round, two new wallets
├─ .env.example
└─ package.json · pnpm-workspace.yaml
```

## License

MIT © 2026 Elina ([@Elinajafari](https://github.com/Elinajafari))
