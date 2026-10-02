# DECISIONS

Why Excuse is built the way it is. Each section names the alternative that was
rejected and what it would have cost.

## The days are agreed before anything happens

The obvious design asks, after the event, "should the deadline move, and by how
much?" That makes the model decide two things at once, and the second one (how
late is acceptable) is exactly what the parties should have agreed. So the
obligee lists the excuses and what each is worth when the obligation opens.
Excuses written after the event would be written to fit it, and days chosen
after it would be a negotiation.

## The answer is an index, or none

What crosses consensus is the frozen index of one listed excuse, or `none`: the
coarsest answer that still carries the judgment. The validator can check its
shape for free (is it none, or an excuse that was actually asked about?), and
two nodes that agree on it cannot move the deadline by different amounts,
because the days come from storage, not from the model.

The index that crosses is the **frozen** one, not the row number in the prompt.
Once an excuse is used, the prompt lists only the unused ones and renumbers
them; storing a row number would store the wrong excuse. A mutation that does
exactly that is in the table, and a test catches it.

## Order-dependence is none, not a guess

The excuses are asked in their frozen order and then reversed. The same excuse
both ways stands; anything else is `none`. The alternative, forgiving a
mismatch, would let one node's reading of "most directly" move a deadline that
another node would have left alone. The party invoking force majeure carries
the burden of showing it, so an account that only fits an excuse in one order
does not move anything. That is written into the value, where it can be seen,
not into the comparison.

## The obligor's own trouble is not an excuse

The prompt says so in words: the obligor's own delay, mistake, staff illness or
higher cost is not an excuse unless a listed excuse names it. Force majeure is
about events outside a party's control, and a model left to its own sense of
fairness tends to excuse a sympathetic account. The demo's second claim (a
supervisor was ill) is written to test exactly that.

## Each excuse is used once, and there are at most two claims

A strike that bought three days cannot buy three more. Used excuses are not
shown again, and a ruling that names one is refused for free. Two claims at
most, one at a time, and an account already ruled on cannot be filed again:
a refused obligor has somewhere to go (a second claim that describes a
different event, or an appeal), and no way to ask the same question until the
answer suits.

## Every waiting state has a clock

A claim filed before the deadline protects the obligation while it waits for a
ruling, because the obligor did what the clause asks in time. It does not
protect it forever: after the grace window, frozen at deploy, anyone may lapse
it. Covenant's one known weakness is a judgment that never reaches consensus
and blocks its facility for good; this is the answer to that here.

A ruling may land after the deadline for a claim filed before it, and the
extension counts from the original deadline, not from the ruling. But only
until the grace window closes: the protection a claim gives and the chance to
have it ruled on end at the same moment, `due_at + grace_seconds`. Past it,
`rule()` refuses before any model is asked, and the obligation can only lapse.
Without that bound a party could let the grace window run out, wait until the
breach is plain, and then ask for a ruling that extends a deadline whose
protection had already expired (a steward review pointed this out). The check
reads the chain's clock, so every node refuses the same transaction, and the
demo puts it on chain: a claim filed in time on obligation 1, a lapse refused
while its grace runs, a ruling refused after it closes, then the lapse.

## Claiming and ruling are two transactions

The account belongs on the record the moment it is made, with the chain's time
on it, whatever happens to the ruling. It also makes the timing honest: the
claim must be before the deadline, the ruling need not be.

## rule() is the parties', lapse() is anyone's

A ruling spends inference on every validator, so only the two parties may ask
for one; either has a reason to. `lapse()` adds nothing and reads no model; it
records only what the clock implies, so it is open, and a party who vanishes
cannot hold an obligation open.

## A parse failure is an error, never a ruling

An unusable answer is retried once inside the block, then raised as
`[LLM_ERROR]`, which validators never agree with. Reading it as `none` would let
a broken model refuse every excuse.

## The agreed ruling is checked twice

The validator refuses a ruling outside the excuses asked. The deterministic
half checks it again before the deadline moves. No public call can reach that
second check while the first is intact, so it is kept in place by a static
test rather than a behavioural one, and the mutation table records that.

## Tagging untrusted text is not a fence

The title, the duty, the excuses and the account are all written by a party
with a stake in the answer. An account could close its own block and list a
new excuse. `fence()` replaces `< > [ ]` at the prompt boundary only, and the
contract numbers the excuses itself, after fencing.

## Why the tests are built the way they are

- **Each node gets its own answers**, and a leader can lie, so every validator check is reachable, and the free layer is measured at zero prompts.
- **The runbook is a test.** The demo is replayed offline before a transaction is spent; once `deployments/studionet.json` exists, the recorded rulings are replayed through this contract, which must move every deadline exactly as the deployed one did.
- **Mutation testing.** `scripts/mutate.py` removes each defence and names the test that caught it.

## GenVM constraints this contract obeys

- the runner is pinned (`py-genlayer:1jb45aa8...`), never `test` or `latest`
- the class is named after the product, because `genvm-lint validate` does not see a class named `Contract`
- no `int`, `list`, `dict` or `tuple` as a storage type, and no collection inside a storage dataclass; excuses are contiguous rows, claims are linked
- every persistent field is declared in the class body
- the block returns a flat dict of strings
- the clock is `gl.message_raw["datetime"]`, converted with integer arithmetic
- the file is pure ASCII
- `genvm-lint` validates against GenVM `v0.3.0-rc7`, the release that ships the pinned runner; `scripts/verify.mjs` sets `GENVM_VERSION` accordingly

## Not upgradable

There is no owner and no admin method. The clause an obligation opened under is
the clause it closes under.

## Success is read from the leader's result, not from ACCEPTED

A refusal is agreed on too: when `claim()` raises "only the obligor may claim
an excuse", the committee accepts that the contract raised it. A script that
treats `ACCEPTED` as success reports a refused write as done. `scripts/lib.mjs`
(`outcome()`) and `scripts/evidence.mjs` read
`consensus_data.leader_receipt[0].result.status` instead: `return` is success,
and a `rollback` carries the contract's own sentence, which is recorded as it
was raised. The shape was measured on studionet with genlayer-js 1.1.8.

## Every role is its own wallet, made in memory

`deploy.mjs` and `seed.mjs` make the deployer, the obligee, the obligor and the
stranger with `generatePrivateKey()` for the run and never write them anywhere,
so on the explorer each role is a different address and every refusal comes
from the account it is about. StudioNet is gasless, so they hold nothing, and a
key that is never on disk cannot leak from a repository. On a funded network
the scripts refuse to run without keys from the environment.

## The lapse waits for the chain's clock, with a margin

The contract decides a lapse by the transaction's own time. The seed script
reads obligation 1's deadline from the chain and sends `lapse()` only once the
local clock is 20 seconds past it, so the one lapse meant to succeed is never
recorded as an early refusal because two clocks disagreed by a few seconds.
