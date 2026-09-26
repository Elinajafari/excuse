# Excuse - GenLayer Intelligent Contract

[`excuse.py`](./excuse.py) is the whole protocol: the obligee opens an
obligation with a deadline and a frozen list of excuses, each worth fixed days;
the obligor claims, before the deadline, that an event happened; validators
rule by consensus, in two orders, which listed excuse the account describes or
none; the deadline moves by that excuse's days; and the obligation ends kept or
breached, readable by another contract in one word.

## Core rule

```
the days are frozen at open(), before anything happens
a ruling is an index into the frozen list, or none: the model never names a number of days
deadline = due date + sum of the frozen days of the excuses ruled to apply
each excuse is used at most once; at most 2 claims, one at a time
```

## Lifecycle

```
obligee:  open(title, duty, obligor, due_in, excuses, days)   excuses and days frozen
obligor:  claim(id, account)        before the deadline; on the record with the chain's time
either:   rule(id)                  [validators, both orders] -> excuse index or none -> deadline moves
obligee:  fulfil(id)                -> kept
anyone:   lapse(id)                 -> breached, once the deadline (and any grace for a waiting claim) has passed
anyone:   count, status, obligation, excuses_of, claims_of
```

Judgment fails **closed**: an unusable model answer is retried once inside
the block and then raised as `[LLM_ERROR]`, which no validator agrees with.
It never moves a deadline. A claim filed in time protects the obligation only
until its ruling or the grace window (frozen at deploy) runs out, so a ruling
that never lands cannot hold an obligation open forever.

## Deploy

```bash
pnpm install                          # from the repo root
pnpm deploy:contract                  # studionet, a deployer key made for this run, grace window 300 s
pnpm deploy:contract testnet-asimov   # needs DEPLOYER_PRIVATE_KEY in .env
pnpm seed:contract                    # the demo, recorded in deployments/studionet.json
pnpm e2e:contract                     # the record checked against the chain
pnpm verify:contract                  # deployed source == excuse.py, and genvm-lint on it
pnpm evidence:contract                # EVIDENCE.md at the repo root, from the chain
```

Every script reads a transaction's outcome from the leader's result
(`return` or `rollback`), never from `ACCEPTED` alone: the committee accepts a
refusal too. Sends are nonce-guarded, so a lost answer is never sent twice.
Why each rule is the way it is: [DECISIONS.md](DECISIONS.md).

## Surface

| Thing | What it is |
|---|---|
| **Obligation** | a title, a duty, an obligee (who opened it), an obligor (who owes the work), a deadline, and its excuses |
| **Excuse** | agreed wording and the whole days it buys (1 to 90), frozen at `open()`; at most 6, each usable once |
| **Claim** | the obligor's account of an event, filed before the deadline; at most 2 per obligation, one at a time |
| **Ruling** | the frozen index of the excuse the account describes, or `none`; the deadline moves by that excuse's days |
| **Status** | `open` → `kept` (the obligee acknowledged the work) or `breached` (the deadline passed) |
| **Grace window** | frozen at deploy: how long past the deadline a claim filed in time protects the obligation while it waits for its ruling |

| Write | Caller | Why |
|---|---|---|
| `open(title, duty, obligor, due_in, excuses, days)` | anyone | the caller becomes the obligee |
| `claim(id, account)` | the obligor, before the deadline | the only party an excuse is for |
| `rule(id)` | the obligee or the obligor | either wants the claim settled |
| `fulfil(id)` | the obligee | acknowledging the work is the obligee's to give |
| `lapse(id)` | anyone, deliberately | it adds no text, reads no model, and records only what the clock implies; a party who vanishes must not hold an obligation open |

| View | Returns |
|---|---|
| `count()` | number of obligations |
| `status(id)` | `open`, `kept` or `breached`: one word for another contract |
| `obligation(id)` | parties, status, the deadline as it stands, days extended, whether a claim is waiting, when the grace window ends |
| `excuses_of(id)` | each excuse, its days, and which claim used it |
| `claims_of(id)` | each claim, its account, its ruling, the days it granted, and the leader's reason |

```python
excuse = gl.get_contract_at(Address(EXCUSE))
if excuse.view().status(obligation_id) == "breached":
    ...  # apply the late-delivery penalty the agreement names
```

## How it holds together

```
claim(id, account)          the account is on the record, with the chain's time, before any model reads it
rule(id)
  └─ nondet block
        leader                               validator
        ask with the unused excuses          refuse a ruling that names no excuse
        in frozen order, then reversed       that was asked about (free)
        same excuse in both → it, else none  ask both orders itself, compare exactly
        send the FROZEN index, not a row     an [LLM_ERROR] is never agreed with
  deterministic half: check the ruling again, mark the excuse used,
  move the deadline by its frozen days
fulfil(id) → kept          lapse(id) → breached, once the deadline and any grace have passed
```

An account that only fits an excuse when it is listed first does not clearly
describe it, and the party invoking an excuse carries the burden of showing it.
That uncertainty goes into the value (no extension), never into the comparison.

## Threat model

| Attack | What stops it |
|---|---|
| Days negotiated after the event | excuses and their days are frozen at `open()`; a ruling can only pick one |
| A leader lies about the ruling | every validator asks both orders itself and must match exactly |
| A leader proposes a used excuse, or a number past the list | refused for free before the validator spends a prompt, and again in the deterministic half |
| A broken model grants an extension by failing | an unusable answer is retried once, then raised as `[LLM_ERROR]`, which no validator agrees with |
| A ruling that depends on the order it was shown | both orders inside one block; a difference is `none` |
| The obligor's own trouble passed off as force majeure | the prompt says so, and the demo's illness claim is ruled `none` on chain |
| Refiling the same account until it wins | an account already ruled on is refused; at most 2 claims, one at a time |
| A claim nobody rules on, holding the obligation open | the grace window: after it, anyone may `lapse()` |
| A stranger claiming, ruling or closing | every gated write checks the sender; a static test walks the source for it |
| Prompt injection inside an account or an excuse | `fence()` replaces `< > [ ]` at the prompt boundary and the contract numbers the rows itself |
| A script reports "done" when the contract refused | success is the leader's `return`, not `ACCEPTED`; a `rollback` is recorded with the contract's own sentence |

## Tests

<!-- measured:tests:start -->
Measured: **142 passed**, 0 skipped, including the checks of the live record in `deployments/studionet.json`, which run once `pnpm seed:contract` has written it. The same record is checked against the chain itself by `pnpm e2e:contract`.
<!-- measured:tests:end -->

The suite runs on [`tests/glsim.py`](tests/glsim.py), a small GenVM stand-in
that executes the real contract file, gives the leader and the validator their
own mock answers, can make a leader lie, sets the chain's clock, and refuses
what GenVM refuses. What each file covers, and what every demo transaction
proves, is in [tests/README.md](tests/README.md).

**The tests have teeth.** [`scripts/mutate.py`](scripts/mutate.py) removes every
defence one at a time and names the test that caught each mutant. It refuses to
run on a red baseline and exits non-zero if anything escapes.

<!-- measured:mutations:start -->
Measured: **65 mutations, 65 caught, 0 escaped.**

| Mutation | Caught by |
|---|---|
| a row number past the list is accepted | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| a word is read as a row number | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| none is not recognised as an answer | `test_none_moves_nothing` |
| the reversed row is not read back into the frozen order | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| a disagreement between the orders keeps the forward excuse | `test_an_excuse_that_depends_on_the_order_is_none` |
| a disagreement between the orders keeps the reverse excuse | `test_an_excuse_that_depends_on_the_order_is_none` |
| the reversed pass is never asked | `test_an_excuse_that_depends_on_the_order_is_none` |
| the second prompt is not reversed | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| the row number is stored instead of the frozen excuse index | `test_each_excuse_is_used_once_and_only_unused_ones_are_asked` |
| an unusable answer is not retried | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| an unusable answer is read as none | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| an answer that is not an object crashes the block | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| the free structural layer is skipped | `test_a_ruling_that_names_no_asked_excuse_is_refused_for_free` |
| a used excuse is sound | `test_a_ruling_that_names_no_asked_excuse_is_refused_for_free` |
| a validator agrees with a leader that raised | `test_an_unusable_answer_is_an_error_and_never_a_ruling` |
| a validator trusts the leader | `test_nodes_that_rule_differently_do_not_agree` |
| a validator whose own model failed agrees | `test_a_validator_whose_model_fails_does_not_agree` |
| agreement ignores soundness | `test_agreement_is_exact_symmetric_and_over_sound_rulings` |
| the stored ruling is not checked against the excuses asked | `test_the_agreed_ruling_is_checked_again_before_it_moves_anything` |
| a granted excuse does not move the deadline | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| a granted excuse moves the deadline by seconds, not days | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| an excuse can be used twice | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| used excuses are asked about again | `test_each_excuse_is_used_once_and_only_unused_ones_are_asked` |
| the days granted are not recorded on the claim | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| a ruling leaves the claim pending | `test_a_listed_excuse_moves_the_deadline_by_its_frozen_days` |
| anyone may claim | `test_only_the_obligor_may_claim` |
| a claim after the deadline is accepted | `test_a_claim_after_the_deadline_is_refused_and_one_on_it_accepted` |
| a claim on the deadline is refused | `test_a_claim_after_the_deadline_is_refused_and_one_on_it_accepted` |
| a second claim may land while one waits | `test_a_second_claim_waits_for_the_first_ruling` |
| claims are unlimited | `test_an_obligation_takes_two_claims_at_most` |
| a claim is accepted with every excuse used | `test_no_claim_once_every_excuse_is_used` |
| the same account can be ruled on twice | `test_the_same_account_cannot_be_ruled_on_twice` |
| a claim on a closed obligation is accepted | `test_the_obligee_acknowledges_the_work` |
| a claim does not mark the obligation as waiting | `test_a_claim_lands_before_it_is_ruled_on` |
| claims are not linked | `IndentationError at import` |
| the account is unbounded | `test_the_account_length_bounds` |
| anyone may ask for a ruling | `test_a_stranger_may_not_ask_for_a_ruling` |
| a ruling may run with nothing waiting | `test_nothing_to_rule_on_is_refused` |
| anyone may acknowledge the work | `test_only_the_obligee_may_acknowledge` |
| the work can be acknowledged twice | `test_the_obligee_acknowledges_the_work` |
| a breach is recorded before the deadline | `test_a_breach_is_recorded_only_after_the_deadline` |
| a breach is recorded on the deadline itself | `test_a_breach_is_recorded_only_after_the_deadline` |
| a waiting claim gives no protection | `test_a_claim_in_time_protects_until_its_ruling_or_the_grace_window` |
| a waiting claim protects forever | `test_a_claim_in_time_protects_until_its_ruling_or_the_grace_window` |
| a closed obligation can lapse | `test_a_breach_is_recorded_only_after_the_deadline` |
| a negative id reads the newest obligation | `test_a_read_with_a_bad_id_is_a_user_error` |
| more than six excuses are accepted | `test_the_excuse_bounds` |
| an excuse of any length is accepted | `test_the_excuse_bounds` |
| two excuses with the same wording are accepted | `test_the_excuse_bounds` |
| a mismatched list of days is accepted | `test_the_excuse_bounds` |
| an excuse may be worth any number of days | `test_the_excuse_bounds` |
| the obligee may be the obligor | `test_the_obligee_cannot_be_the_obligor` |
| the deadline is unbounded | `test_the_other_bounds` |
| the grace window is unbounded | `test_the_grace_window_is_bounded_at_deploy` |
| the duty is unbounded | `test_the_other_bounds` |
| the fence is removed | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the fence leaves square brackets | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the fence deletes instead of replacing | `test_the_fence_replaces_and_preserves_length` |
| the account reaches the prompt unfenced | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the excuses reach the prompt unfenced | `test_every_value_interpolated_into_the_prompt_is_fenced_or_ours` |
| the obligation reaches the prompt unfenced | `test_every_value_interpolated_into_the_prompt_is_fenced_or_ours` |
| the prompt no longer states the range | `test_each_excuse_is_used_once_and_only_unused_ones_are_asked` |
| the prompt no longer says the obligor's own trouble is not an excuse | `test_the_prompt_says_the_obligor_s_own_trouble_is_not_an_excuse` |
| a leader's reason is stored as sent | `test_the_reason_is_not_compared_and_is_stored_sanitised` |
| a leader's reason is stored uncapped | `test_the_reason_is_not_compared_and_is_stored_sanitised` |
<!-- measured:mutations:end -->

## Verified against the live deployment

<!-- measured:deployment:start -->
Deployed on studionet at [`0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E`](https://explorer-studio.genlayer.com/address/0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E) (deploy [`0x30ae8fac...`](https://explorer-studio.genlayer.com/tx/0x30ae8facf363d87c32bd17fb25629ac88ead35f6aefadb0519d291c79b1587e2)), with a grace window of 300 s. Every value below was read back from the chain by `scripts/seed.mjs` and written to [`deployments/studionet.json`](deployments/studionet.json); none of it is typed by hand.

| Obligation | Status | Days extended | Deadline now |
|---|---|---|---|
| 0: Catalogue delivery for the Harbour trade fair | kept | 3 | 2026-09-27T13:52:19Z |
| 1: Stand signage for the Harbour trade fair | breached | 0 | 2026-09-24T12:57:36Z |

Every claim, and what the validators ruled:

| Obligation | Claim | Ruling | Days | Reason the leader gave (not consensus) |
|---|---|---|---|---|
| 0 | A national port strike began on 3 March and stopped every carrier serving the Rotterdam de... | excuse 0: a strike or blockade that stops carriers serving the delivery route | 3 | The account describes a strike stopping carriers serving the delivery route. |
| 0 | Our print supervisor was ill for a week in February, so the second print run started late ... | none | 0 | Staff illness is not listed as an excuse; the delay was due to internal personnel issues rather than authorities or natural disasters. |

Every transaction, in order, refusals included:

| Step | Outcome | Transaction |
|---|---|---|
| obligation 0 opened: three excuses | ok | [`0xde4b3eb4...`](https://explorer-studio.genlayer.com/tx/0xde4b3eb4d6d66ff316b939cd2172bb13f2da991c29a8e6747a282ac5da9074cf) |
| obligation 1 opened: five minutes | ok | [`0x11e30856...`](https://explorer-studio.genlayer.com/tx/0x11e30856422e6cdec5a839ffc24eb0ab6df89d457745ab329105f8d0307d1cec) |
| a breach recorded before the deadline | refused: the deadline is 2026-09-24T12:57:36Z | [`0x11ddac12...`](https://explorer-studio.genlayer.com/tx/0x11ddac122bb799d528531090581c4831c3d9686f08ae944fb6dc107f1af0d36d) |
| a stranger claims an excuse | refused: only the obligor may claim an excuse | [`0x5cdb2fcf...`](https://explorer-studio.genlayer.com/tx/0x5cdb2fcf96f0856e2ceac8fd7804f31f6c84cdda9dab0b892bae59ed15e0ac6b) |
| the obligor claims: a port strike | ok | [`0x559d582c...`](https://explorer-studio.genlayer.com/tx/0x559d582c4665721b0041e2efc056d6fe0965b65c63f00646503978659a756599) |
| a second claim while one waits | refused: a claim is waiting for its ruling; either party may ask for it | [`0xee29ddcd...`](https://explorer-studio.genlayer.com/tx/0xee29ddcd575794d36d812497cb770ec7edc8b8a9ee47613f8561f9aea00f6abd) |
| a stranger asks for the ruling | refused: only the obligee or the obligor may ask for a ruling | [`0xe06842ec...`](https://explorer-studio.genlayer.com/tx/0xe06842ec8b22317096fcbce7527531924977d670a251d361ab3a3aa5b6839fbb) |
| ruled: both orders, every excuse | ok | [`0x600e96be...`](https://explorer-studio.genlayer.com/tx/0x600e96be67ee3e410d029ca43152c1b55365f46d720844b94d1272d692b56962) |
| the same account again | refused: this account was already ruled on; a new claim has to describe the event differently | [`0x33667f8c...`](https://explorer-studio.genlayer.com/tx/0x33667f8c90711d3949e49a72b472af190b640a967bf1fb628910fb2a8928e547) |
| the obligor claims: staff illness | ok | [`0xc32246fd...`](https://explorer-studio.genlayer.com/tx/0xc32246fd7e1f99fa79f1adb4cb7f6cbb46bad054683703e321b6e4d8ab4bae49) |
| ruled: the unused excuses only | ok | [`0xd0ec2c51...`](https://explorer-studio.genlayer.com/tx/0xd0ec2c5106e4dd4d359c3dd2a4c20b7f8705bbc37bbc8976f537a3f3cbd80e2c) |
| a third claim | refused: an obligation takes at most 2 claims | [`0x69e2c39d...`](https://explorer-studio.genlayer.com/tx/0x69e2c39d882d87f6eb8138dcffa5f8e89cf36131970e099a17fa130e17f43438) |
| obligation 0 kept | ok | [`0xd1d68c3c...`](https://explorer-studio.genlayer.com/tx/0xd1d68c3c4822f065a04d0d53f65982036a72e450f6a9ed16e4e15983b39123b3) |
| obligation 1 breached | ok | [`0xab55842f...`](https://explorer-studio.genlayer.com/tx/0xab55842f0ccdcd167f28798f1acfdd4c21c60c02279c097890e66222c43d0667) |

`tests/test_runbook.py::TestTheRecord` replays these rulings through this repository's contract and fails unless it moves every deadline exactly as the deployed one did.
<!-- measured:deployment:end -->

On top of the record: `pnpm e2e:contract` asks the chain again for every transaction and
every view and checks each against the record, and `pnpm verify:contract` reads the
deployed source back with `gen_getContractCode`, compares it byte for byte with
`packages/contracts/excuse.py`, and runs genvm-lint on the deployed bytes.

## Known limits

- Validators judge what the account describes, not whether it is true. Evidence of the event is outside the contract.
- The list is only as good as its wording; an event nobody listed moves nothing.
- Whole days only, 1 to 90 per excuse, at most 6 excuses and 2 claims per obligation.
- StudioNet is a test network; its state can be reset.

## Path forward

- A penalty or payment contract that reads `status()` and pays or charges on `kept` or `breached`.
- Evidence links in a claim, fetched and read alongside the account.
- Partial extensions as a listed option ("half the days if the route reopened within 24 hours").
