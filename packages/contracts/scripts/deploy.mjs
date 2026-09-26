// Deploy excuse.py to a GenLayer network and start the deployment record.
//
//   pnpm deploy:contract                   # studionet, a deployer key made for this run
//   pnpm deploy:contract testnet-asimov    # needs DEPLOYER_PRIVATE_KEY in .env
//
// The grace window is the constructor's one argument and is frozen for the
// contract's life; it is read from demo/demo.json so the tests replay the same
// value. Writes deployments/studionet.json with the address, the deploy
// transaction, the deployer and the sha256 of the exact file that was
// deployed. `pnpm seed:contract` then appends the demo to the same record.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CONTRACT_FILE, EXPLORER, PKG, RECORD_FILE, accountFrom, clientFor, loadEnv, network, recorder, sourceSha256 } from "./lib.mjs";

loadEnv();
const net = network();
const demo = JSON.parse(readFileSync(path.join(PKG, "demo", "demo.json"), "utf8"));
const deployer = accountFrom("DEPLOYER_PRIVATE_KEY", net);
const client = clientFor(net, deployer);
const code = readFileSync(CONTRACT_FILE, "utf8");

console.log(`\ndeploying ${path.basename(CONTRACT_FILE)} to ${net.name} from ${deployer.address}`);
console.log(`  grace window ${demo.grace_seconds} s`);
const rec = recorder();
const address = await rec.deploy(client, deployer, code, [demo.grace_seconds]);

const record = {
  network: net.name,
  chain_id: net.chain.id,
  contract: address,
  explorer: `${EXPLORER}/address/${address}`,
  source_sha256: sourceSha256(),
  constructor: { grace_seconds: demo.grace_seconds },
  deployer: deployer.address,
  steps: rec.steps,
};
mkdirSync(path.dirname(RECORD_FILE), { recursive: true });
writeFileSync(RECORD_FILE, JSON.stringify(record, null, 2) + "\n");

console.log(`\n  explorer  ${record.explorer}`);
console.log(`  deployer  ${deployer.address}\n  next      pnpm seed:contract\n`);
