// Put the demo on the explorer: every route the contract has, refusals included.
//
//   pnpm seed:contract
//
// Reads the address from deployments/studionet.json (written by deploy.mjs),
// opens the two obligations in demo/demo.json, files the claims, asks for the
// rulings, keeps one obligation and lets the other lapse into breach, and
// sends every write the contract exists to refuse. Everything is appended to
// the same record: each transaction hash and its sender, its status, the
// refusal sentence where there was one, and each obligation's deadline,
// excuses and claims as the chain holds them. Nothing in that file is typed
// by hand.
//
// Three wallets act, each in one role: the obligee (opens, rules, fulfils),
// the obligor (claims) and a stranger (tries what it may not). They come from
// OBLIGEE_PRIVATE_KEY, OBLIGOR_PRIVATE_KEY and STRANGER_PRIVATE_KEY, or on
// studionet are made in memory for this run and never written to disk. The
// run stops at the first step that does not do what the demo expects, because
// the record claims whatever it holds.
//
// The steps are the ones tests/test_runbook.py replays offline, in the same
// order, so a demo that could not succeed fails a test before it costs a
// transaction.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PKG, RECORD_FILE, accountFrom, clientFor, loadEnv, network, readRetry, recorder, sleep, sourceSha256 } from "./lib.mjs";

loadEnv();
const net = network();
const record = JSON.parse(readFileSync(RECORD_FILE, "utf8"));
if (record.source_sha256 !== sourceSha256()) {
  throw new Error("excuse.py has changed since it was deployed; run pnpm deploy:contract first");
}
const address = record.contract;
const demo = JSON.parse(readFileSync(path.join(PKG, "demo", "demo.json"), "utf8"));
const joined = (xs) => xs.map(String).join("|");

const obligee = accountFrom("OBLIGEE_PRIVATE_KEY", net);
const obligor = accountFrom("OBLIGOR_PRIVATE_KEY", net);
const stranger = accountFrom("STRANGER_PRIVATE_KEY", net);
const as = new Map([obligee, obligor, stranger].map((a) => [a, clientFor(net, a)]));
const ro = clientFor(net, null);
console.log(`\ncontract ${address}\n  obligee  ${obligee.address}\n  obligor  ${obligor.address}\n  stranger ${stranger.address}`);

const rec = recorder();
const send = (who, fn, args, step, expect = "ok") => rec.write(as.get(who), who, address, fn, args, { step, expect });
const read = (fn, args = []) => readRetry(() => ro.readContract({ address, functionName: fn, args }));
const plain = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x instanceof Map ? Object.fromEntries(x) : x)));

const o = demo.obligation;
const s = demo.short_obligation;
const c = demo.claims;

console.log("\ntwo obligations");
await send(obligee, "open", [o.title, o.duty, obligor.address, o.due_in, joined(o.excuses), joined(o.days)], "obligation 0 opened: three excuses");
await send(obligee, "open", [s.title, s.duty, obligor.address, s.due_in, joined(o.excuses), joined(o.days)], "obligation 1 opened: five minutes");
await send(stranger, "lapse", [1], "a breach recorded before the deadline", "refused");

console.log("\nthe first claim: a strike");
await send(stranger, "claim", [0, c.strike], "a stranger claims an excuse", "refused");
await send(obligor, "claim", [0, c.strike], "the obligor claims: a port strike");
await send(obligor, "claim", [0, c.illness], "a second claim while one waits", "refused");
await send(stranger, "rule", [0], "a stranger asks for the ruling", "refused");
await send(obligee, "rule", [0], "ruled: both orders, every excuse");

console.log("\nthe second claim: the obligor's own trouble");
await send(obligor, "claim", [0, c.strike], "the same account again", "refused");
await send(obligor, "claim", [0, c.illness], "the obligor claims: staff illness");
await send(obligor, "rule", [0], "ruled: the unused excuses only");
await send(obligor, "claim", [0, c.third], "a third claim", "refused");

console.log("\nclosing");
await send(obligee, "fulfil", [0], "obligation 0 kept");
// The chain's clock decides a lapse, so wait until the deadline has passed by
// a margin before sending: a lapse sent early would be refused and recorded.
const due = Date.parse(plain(await read("obligation", [1])).due_at);
for (let left = due + 20_000 - Date.now(); left > 0; left = due + 20_000 - Date.now()) {
  console.log(`  waiting ${Math.ceil(left / 1000)} s for obligation 1's deadline`);
  await sleep(Math.min(left, 30_000));
}
await send(stranger, "lapse", [1], "obligation 1 breached");

const n = Number(await read("count"));
const obligations = [];
for (let k = 0; k < n; k++) {
  obligations.push({
    obligation: plain(await read("obligation", [k])),
    excuses: plain(await read("excuses_of", [k])).excuses,
    claims: plain(await read("claims_of", [k])).claims,
  });
}

const out = {
  ...record,
  accounts: { deployer: record.deployer, obligee: obligee.address, obligor: obligor.address, stranger: stranger.address },
  steps: [...record.steps.filter((st) => st.step === "deploy"), ...rec.steps],
  obligations,
};
writeFileSync(RECORD_FILE, JSON.stringify(out, null, 2) + "\n");

console.log("");
for (const [k, ob] of obligations.entries()) {
  console.log(`  obligation ${k}  ${String(ob.obligation.status).padEnd(9)} extended ${ob.obligation.days_extended} days  rulings ${JSON.stringify(ob.claims.map((x) => x.ruling))}`);
}
console.log(`  written    ${path.relative(PKG, RECORD_FILE)}\n`);
