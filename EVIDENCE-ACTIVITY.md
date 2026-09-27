# Evidence: Excuse, second round on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E`](https://explorer-studio.genlayer.com/address/0xe6e9B934aF3600665dDCAeE2842FDb3B492f8a0E)
- **Round:** new wallets on the contract already deployed; no deploy in this round
- **The deployment itself:** [EVIDENCE.md](EVIDENCE.md)
- **Transactions:** 6, from 2 different wallets
- **Generated:** 2026-09-26 16:12 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| obligee | [`0xaB37C2D043e76081A985278b1752784601B92453`](https://explorer-studio.genlayer.com/address/0xaB37C2D043e76081A985278b1752784601B92453) | 4 |
| obligor | [`0x0113eafF77C7d7B3C247BC013781eC3F920E7913`](https://explorer-studio.genlayer.com/address/0x0113eafF77C7d7B3C247BC013781eC3F920E7913) | 2 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | obligation 2 opened by a new obligee: three excuses | obligee [`0xaB37…2453`](https://explorer-studio.genlayer.com/address/0xaB37C2D043e76081A985278b1752784601B92453) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0x0be9848e…afc8`](https://explorer-studio.genlayer.com/tx/0x0be9848e328d9113b424b559f724034b6d762276bc33e2045258fa9eba76afc8) |
| 1 | the obligee tries to claim | obligee [`0xaB37…2453`](https://explorer-studio.genlayer.com/address/0xaB37C2D043e76081A985278b1752784601B92453) | `claim` | FINALIZED · MAJORITY_AGREE | refused: only the obligor may claim an excuse | [`0xa196834c…4608`](https://explorer-studio.genlayer.com/tx/0xa196834cad9fd93136743d0e442af3a83d8dbf4efe82b13a4d36d2f2f5db4608) |
| 2 | a new obligor claims: a storm flooded the print works | obligor [`0x0113…7913`](https://explorer-studio.genlayer.com/address/0x0113eafF77C7d7B3C247BC013781eC3F920E7913) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0xac5b9bd1…a255`](https://explorer-studio.genlayer.com/tx/0xac5b9bd1233499c10126060da940b25707b2b0b5598a2f03f2ca362f31d4a255) |
| 3 | ruled: both orders (expected excuse 2) | obligee [`0xaB37…2453`](https://explorer-studio.genlayer.com/address/0xaB37C2D043e76081A985278b1752784601B92453) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0x62119cc9…69cf`](https://explorer-studio.genlayer.com/tx/0x62119cc924bd314d9a918b2145acff8494b43bfe2405dd317c57eb1de05069cf) |
| 4 | the obligor tries to acknowledge the work | obligor [`0x0113…7913`](https://explorer-studio.genlayer.com/address/0x0113eafF77C7d7B3C247BC013781eC3F920E7913) | `fulfil` | ACCEPTED · MAJORITY_AGREE | refused: only the obligee may acknowledge the work | [`0x8685382b…d606`](https://explorer-studio.genlayer.com/tx/0x8685382b763a5a8032e410d14f4c48494d6b8709bfb981b2aea484c2a254d606) |
| 5 | obligation 2 kept | obligee [`0xaB37…2453`](https://explorer-studio.genlayer.com/address/0xaB37C2D043e76081A985278b1752784601B92453) | `fulfil` | ACCEPTED · MAJORITY_AGREE | executed | [`0x92dfb61a…79a3`](https://explorer-studio.genlayer.com/tx/0x92dfb61ac1fdad224cbac83b3f9bbae6c28141d9cc5592ab872f0a4cf5e979a3) |
