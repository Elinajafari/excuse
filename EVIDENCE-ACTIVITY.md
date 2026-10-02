# Evidence: Excuse, second round on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0x1331950259A2D0a524543EbD17E6da2892198480`](https://explorer-studio.genlayer.com/address/0x1331950259A2D0a524543EbD17E6da2892198480)
- **Round:** new wallets on the contract already deployed; no deploy in this round
- **The deployment itself:** [EVIDENCE.md](EVIDENCE.md)
- **Transactions:** 6, from 2 different wallets
- **Generated:** 2026-10-02 19:45 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| obligee | [`0x4241DeDB2353e2378048b9a92d718662De5f82ce`](https://explorer-studio.genlayer.com/address/0x4241DeDB2353e2378048b9a92d718662De5f82ce) | 4 |
| obligor | [`0xa22D0ba31B33Aa250014ff0dc7B21f90d8553AAC`](https://explorer-studio.genlayer.com/address/0xa22D0ba31B33Aa250014ff0dc7B21f90d8553AAC) | 2 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | obligation 2 opened by a new obligee: three excuses | obligee [`0x4241…82ce`](https://explorer-studio.genlayer.com/address/0x4241DeDB2353e2378048b9a92d718662De5f82ce) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0xab848140…e149`](https://explorer-studio.genlayer.com/tx/0xab848140232da84efc5ebf1e5d44da2ebb1d041711cfb9a66169fede3a72e149) |
| 1 | the obligee tries to claim | obligee [`0x4241…82ce`](https://explorer-studio.genlayer.com/address/0x4241DeDB2353e2378048b9a92d718662De5f82ce) | `claim` | FINALIZED · MAJORITY_AGREE | refused: only the obligor may claim an excuse | [`0x1ad692a5…4930`](https://explorer-studio.genlayer.com/tx/0x1ad692a59ecb22ddabdbee8500aa214701b473dbb58eebf3194d9bf244334930) |
| 2 | a new obligor claims: a storm flooded the print works | obligor [`0xa22D…3AAC`](https://explorer-studio.genlayer.com/address/0xa22D0ba31B33Aa250014ff0dc7B21f90d8553AAC) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0x39c054ee…083a`](https://explorer-studio.genlayer.com/tx/0x39c054ee70ecd45d1ed78cdafd88a371bd9d6cdb878f0f0f02ee88f50c35083a) |
| 3 | ruled: both orders (expected excuse 2) | obligee [`0x4241…82ce`](https://explorer-studio.genlayer.com/address/0x4241DeDB2353e2378048b9a92d718662De5f82ce) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0x7e543767…0ab2`](https://explorer-studio.genlayer.com/tx/0x7e5437676b5a00ca5b23cf76db046dc820a9c57b47d950dbb08d36d659720ab2) |
| 4 | the obligor tries to acknowledge the work | obligor [`0xa22D…3AAC`](https://explorer-studio.genlayer.com/address/0xa22D0ba31B33Aa250014ff0dc7B21f90d8553AAC) | `fulfil` | ACCEPTED · MAJORITY_AGREE | refused: only the obligee may acknowledge the work | [`0x4e795383…027c`](https://explorer-studio.genlayer.com/tx/0x4e7953839f40bcb641ec826545821e5031f74dd0feaa365f048a80523e1f027c) |
| 5 | obligation 2 kept | obligee [`0x4241…82ce`](https://explorer-studio.genlayer.com/address/0x4241DeDB2353e2378048b9a92d718662De5f82ce) | `fulfil` | ACCEPTED · MAJORITY_AGREE | executed | [`0x026af35b…b1a3`](https://explorer-studio.genlayer.com/tx/0x026af35b4172cc4e8aa3ca6aacfc8c323c12ead0057d86f5426402a11c59b1a3) |
