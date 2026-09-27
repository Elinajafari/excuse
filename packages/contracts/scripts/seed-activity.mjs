// A second round on the deployed contract, from two NEW wallets.
//
//   pnpm seed:activity
//
// The contract in deployments/studionet.json is not redeployed. Two wallets
// made in memory for this run, used by nothing else, run one obligation from
// open to kept, and each tries once what only the other may do:
//
//   obligee   opens a new obligation (festival menus, three excuses)
//   obligee   claims an excuse                   refused: only the obligor may claim
//   obligor   claims: a storm flooded the print works
//   obligee   asks for the ruling                expected excuse 2 (fire, flood or storm): +5 days
//   obligor   acknowledges the work              refused: only the obligee may
//   obligee   acknowledges the work              kept
//
// Everything goes to deployments/studionet-activity.json, apart from the demo's
// own record, so the demo and the tests that replay it are untouched. Then
// `pnpm evidence:activity` writes EVIDENCE-ACTIVITY.md from the chain.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { PKG, RECORD_FILE, clientFor, loadEnv, network, readRetry, recorder } from "./lib.mjs";

loadEnv();
const net = network();
if (net.name !== "studionet") throw new Error("the activity round makes throwaway wallets; run it on studionet");
const address = JSON.parse(readFileSync(RECORD_FILE, "utf8")).contract;
const data = JSON.parse(readFileSync(path.join(PKG, "demo", "activity.json"), "utf8"));
const OUT = path.join(PKG, "deployments", "studionet-activity.json");

const obligee = createAccount(generatePrivateKey());
const obligor = createAccount(generatePrivateKey());
const asObligee = clientFor(net, obligee);
const asObligor = clientFor(net, obligor);
const ro = clientFor(net, null);
const read = (fn, args = []) => readRetry(() => ro.readContract({ address, functionName: fn, args }));

const id = Number(await read("count"));
console.log(`\ncontract ${address} (already deployed, ${id} obligations on it)\n  obligee ${obligee.address}\n  obligor ${obligor.address}`);

const o = data.obligation;
const rec = recorder();
await rec.write(asObligee, obligee, address, "open", [o.title, o.duty, obligor.address, o.due_in, o.excuses.join("|"), o.days.join("|")],
  { step: `obligation ${id} opened by a new obligee: three excuses` });
await rec.write(asObligee, obligee, address, "claim", [id, data.claim], { step: "the obligee tries to claim", expect: "refused" });
await rec.write(asObligor, obligor, address, "claim", [id, data.claim], { step: "a new obligor claims: a storm flooded the print works" });
await rec.write(asObligee, obligee, address, "rule", [id], { step: `ruled: both orders (expected excuse ${data.expected_ruling})` });
await rec.write(asObligor, obligor, address, "fulfil", [id], { step: "the obligor tries to acknowledge the work", expect: "refused" });
await rec.write(asObligee, obligee, address, "fulfil", [id], { step: `obligation ${id} kept` });

const plain = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x instanceof Map ? Object.fromEntries(x) : x)));
const result = {
  obligation: plain(await read("obligation", [id])),
  excuses: plain(await read("excuses_of", [id])).excuses,
  claims: plain(await read("claims_of", [id])).claims,
};
writeFileSync(OUT, JSON.stringify({
  network: net.name,
  contract: address,
  accounts: { obligee: obligee.address, obligor: obligor.address },
  steps: rec.steps,
  obligations: { [id]: result },
}, null, 2) + "\n");

console.log(`  obligation ${id}  ${result.obligation.status}  extended ${result.obligation.days_extended} days  rulings ${JSON.stringify(result.claims.map((c) => c.ruling))}`);
console.log(`  written    ${path.relative(PKG, OUT)}\n`);
