// Check the live deployment against the record, from the chain, read only.
//
//   pnpm e2e:contract
//
// deployments/studionet.json says what the demo did. This asks the chain
// again, with no key: every transaction's receipt must still say what the
// record says (executed, or refused with the same sentence), and every
// obligation, excuse and claim must read back exactly as recorded. It prints
// PASS or FAIL per check and exits non-zero on any FAIL, so a record that
// drifted from the chain cannot sit in the repo looking verified.

import { readFileSync } from "node:fs";
import { RECORD_FILE, clientFor, loadEnv, network, outcome, readRetry, sourceSha256 } from "./lib.mjs";

loadEnv();
const net = network();
const record = JSON.parse(readFileSync(RECORD_FILE, "utf8"));
const client = clientFor(net, null);
const address = record.contract;

let failed = 0;
function check(name, ok, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `\n      ${detail}` : ""}`);
}
const view = (functionName, args = []) => readRetry(() => client.readContract({ address, functionName, args }));
const plain = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x instanceof Map ? Object.fromEntries(x) : x)));
const sorted = (o) => (Array.isArray(o) ? o.map(sorted) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sorted(o[k])])) : o);
const same = (a, b) => JSON.stringify(sorted(plain(a))) === JSON.stringify(sorted(plain(b)));

console.log(`\n${record.network} contract ${address}\n`);
check("the recorded source is the file in this repo", record.source_sha256 === sourceSha256());

for (const s of record.steps) {
  const receipt = await readRetry(() => client.getTransaction({ hash: s.tx }));
  const out = outcome(receipt);
  const good = s.ok ? out.ok : !out.ok && out.refusal === s.refusal;
  check(`tx ${s.tx.slice(0, 10)}  ${s.step}`, good, `chain says ok=${out.ok} ${out.status} "${out.refusal}"`);
}

const count = Number(await view("count"));
check(`count is at least the ${record.obligations.length} demo obligations`, count >= record.obligations.length, `count ${count}`);

// Both demo obligations are closed (kept, breached), so nothing on them can
// change after the record was written: every field must match exactly.
for (const [k, want] of record.obligations.entries()) {
  check(`obligation ${k} reads back as recorded (${want.obligation.status}, +${want.obligation.days_extended} days)`,
    same(await view("obligation", [k]), want.obligation));
  check(`obligation ${k}: ${want.excuses.length} excuses and which claim used each`,
    same(plain(await view("excuses_of", [k])).excuses, want.excuses));
  check(`obligation ${k}: ${want.claims.length} claims and their rulings`,
    same(plain(await view("claims_of", [k])).claims, want.claims));
  const status = await view("status", [k]);
  check(`obligation ${k} status is ${want.obligation.status}`, status === want.obligation.status, `chain says ${status}`);
}

console.log(`\n${failed === 0 ? "every check passed" : `${failed} check(s) failed`}`);
process.exit(failed === 0 ? 0 : 1);
