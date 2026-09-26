# Evidence: Excuse on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E`](https://explorer-studio.genlayer.com/address/0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E)
- **Deploy transaction:** [`0x30ae8fac…87e2`](https://explorer-studio.genlayer.com/tx/0x30ae8facf363d87c32bd17fb25629ac88ead35f6aefadb0519d291c79b1587e2)
- **Source sha256:** `7e89c8270b525a5936c641c28a3d5fdc8f9e4f85980572ad5d570c4dbdc8ccb8`
- **Transactions:** 15, from 4 different wallets
- **Generated:** 2026-09-26 12:33 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| deployer | [`0x7341Bc21D4a09756b98f1B90E0df13Ed05002623`](https://explorer-studio.genlayer.com/address/0x7341Bc21D4a09756b98f1B90E0df13Ed05002623) | 1 |
| obligee | [`0x158B835C873846519b2AfE0Ae04Db240912CE64f`](https://explorer-studio.genlayer.com/address/0x158B835C873846519b2AfE0Ae04Db240912CE64f) | 4 |
| stranger | [`0x95157172Ba509A6489504A6e06A9227e83cB9c12`](https://explorer-studio.genlayer.com/address/0x95157172Ba509A6489504A6e06A9227e83cB9c12) | 4 |
| obligor | [`0x328916665B1b55BEcACd2003C0966d730c366D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | 6 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | deploy | deployer [`0x7341…2623`](https://explorer-studio.genlayer.com/address/0x7341Bc21D4a09756b98f1B90E0df13Ed05002623) | `deploy` | FINALIZED · MAJORITY_AGREE | executed | [`0x30ae8fac…87e2`](https://explorer-studio.genlayer.com/tx/0x30ae8facf363d87c32bd17fb25629ac88ead35f6aefadb0519d291c79b1587e2) |
| 1 | obligation 0 opened: three excuses | obligee [`0x158B…E64f`](https://explorer-studio.genlayer.com/address/0x158B835C873846519b2AfE0Ae04Db240912CE64f) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0xde4b3eb4…74cf`](https://explorer-studio.genlayer.com/tx/0xde4b3eb4d6d66ff316b939cd2172bb13f2da991c29a8e6747a282ac5da9074cf) |
| 2 | obligation 1 opened: five minutes | obligee [`0x158B…E64f`](https://explorer-studio.genlayer.com/address/0x158B835C873846519b2AfE0Ae04Db240912CE64f) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0x11e30856…1cec`](https://explorer-studio.genlayer.com/tx/0x11e30856422e6cdec5a839ffc24eb0ab6df89d457745ab329105f8d0307d1cec) |
| 3 | a breach recorded before the deadline | stranger [`0x9515…9c12`](https://explorer-studio.genlayer.com/address/0x95157172Ba509A6489504A6e06A9227e83cB9c12) | `lapse` | FINALIZED · MAJORITY_AGREE | refused: the deadline is 2026-09-24T12:57:36Z | [`0x11ddac12…d36d`](https://explorer-studio.genlayer.com/tx/0x11ddac122bb799d528531090581c4831c3d9686f08ae944fb6dc107f1af0d36d) |
| 4 | a stranger claims an excuse | stranger [`0x9515…9c12`](https://explorer-studio.genlayer.com/address/0x95157172Ba509A6489504A6e06A9227e83cB9c12) | `claim` | FINALIZED · MAJORITY_AGREE | refused: only the obligor may claim an excuse | [`0x5cdb2fcf…ac6b`](https://explorer-studio.genlayer.com/tx/0x5cdb2fcf96f0856e2ceac8fd7804f31f6c84cdda9dab0b892bae59ed15e0ac6b) |
| 5 | the obligor claims: a port strike | obligor [`0x3289…6D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0x559d582c…6599`](https://explorer-studio.genlayer.com/tx/0x559d582c4665721b0041e2efc056d6fe0965b65c63f00646503978659a756599) |
| 6 | a second claim while one waits | obligor [`0x3289…6D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | `claim` | FINALIZED · MAJORITY_AGREE | refused: a claim is waiting for its ruling; either party may ask for it | [`0xee29ddcd…6abd`](https://explorer-studio.genlayer.com/tx/0xee29ddcd575794d36d812497cb770ec7edc8b8a9ee47613f8561f9aea00f6abd) |
| 7 | a stranger asks for the ruling | stranger [`0x9515…9c12`](https://explorer-studio.genlayer.com/address/0x95157172Ba509A6489504A6e06A9227e83cB9c12) | `rule` | FINALIZED · MAJORITY_AGREE | refused: only the obligee or the obligor may ask for a ruling | [`0xe06842ec…9fbb`](https://explorer-studio.genlayer.com/tx/0xe06842ec8b22317096fcbce7527531924977d670a251d361ab3a3aa5b6839fbb) |
| 8 | ruled: both orders, every excuse | obligee [`0x158B…E64f`](https://explorer-studio.genlayer.com/address/0x158B835C873846519b2AfE0Ae04Db240912CE64f) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0x600e96be…6962`](https://explorer-studio.genlayer.com/tx/0x600e96be67ee3e410d029ca43152c1b55365f46d720844b94d1272d692b56962) |
| 9 | the same account again | obligor [`0x3289…6D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | `claim` | FINALIZED · MAJORITY_AGREE | refused: this account was already ruled on; a new claim has to describe the event differently | [`0x33667f8c…e547`](https://explorer-studio.genlayer.com/tx/0x33667f8c90711d3949e49a72b472af190b640a967bf1fb628910fb2a8928e547) |
| 10 | the obligor claims: staff illness | obligor [`0x3289…6D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0xc32246fd…ae49`](https://explorer-studio.genlayer.com/tx/0xc32246fd7e1f99fa79f1adb4cb7f6cbb46bad054683703e321b6e4d8ab4bae49) |
| 11 | ruled: the unused excuses only | obligor [`0x3289…6D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0xd0ec2c51…0e2c`](https://explorer-studio.genlayer.com/tx/0xd0ec2c5106e4dd4d359c3dd2a4c20b7f8705bbc37bbc8976f537a3f3cbd80e2c) |
| 12 | a third claim | obligor [`0x3289…6D3c`](https://explorer-studio.genlayer.com/address/0x328916665B1b55BEcACd2003C0966d730c366D3c) | `claim` | FINALIZED · MAJORITY_AGREE | refused: an obligation takes at most 2 claims | [`0x69e2c39d…3438`](https://explorer-studio.genlayer.com/tx/0x69e2c39d882d87f6eb8138dcffa5f8e89cf36131970e099a17fa130e17f43438) |
| 13 | obligation 0 kept | obligee [`0x158B…E64f`](https://explorer-studio.genlayer.com/address/0x158B835C873846519b2AfE0Ae04Db240912CE64f) | `fulfil` | FINALIZED · MAJORITY_AGREE | executed | [`0xd1d68c3c…23b3`](https://explorer-studio.genlayer.com/tx/0xd1d68c3c4822f065a04d0d53f65982036a72e450f6a9ed16e4e15983b39123b3) |
| 14 | obligation 1 breached | stranger [`0x9515…9c12`](https://explorer-studio.genlayer.com/address/0x95157172Ba509A6489504A6e06A9227e83cB9c12) | `lapse` | FINALIZED · MAJORITY_AGREE | executed | [`0xab55842f…0667`](https://explorer-studio.genlayer.com/tx/0xab55842f0ccdcd167f28798f1acfdd4c21c60c02279c097890e66222c43d0667) |
