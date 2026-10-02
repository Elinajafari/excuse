# Evidence: Excuse on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0x1331950259A2D0a524543EbD17E6da2892198480`](https://explorer-studio.genlayer.com/address/0x1331950259A2D0a524543EbD17E6da2892198480)
- **Deploy transaction:** [`0x25a21cbd…1efc`](https://explorer-studio.genlayer.com/tx/0x25a21cbde6bc735cada855e97852316f9447c9569f20bca4b30d5892135f1efc)
- **Source sha256:** `95fbe031d6cd4d127bb75460d894e32ed8608c4261956ce6e33f69b75e6ffa53`
- **Transactions:** 18, from 4 different wallets
- **Generated:** 2026-10-02 19:44 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| deployer | [`0x6F17364B4495ee8A34f2FA6195a492b956748dd9`](https://explorer-studio.genlayer.com/address/0x6F17364B4495ee8A34f2FA6195a492b956748dd9) | 1 |
| obligee | [`0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7`](https://explorer-studio.genlayer.com/address/0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7) | 5 |
| stranger | [`0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34`](https://explorer-studio.genlayer.com/address/0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34) | 5 |
| obligor | [`0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | 7 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | deploy | deployer [`0x6F17…8dd9`](https://explorer-studio.genlayer.com/address/0x6F17364B4495ee8A34f2FA6195a492b956748dd9) | `deploy` | FINALIZED · MAJORITY_AGREE | executed | [`0x25a21cbd…1efc`](https://explorer-studio.genlayer.com/tx/0x25a21cbde6bc735cada855e97852316f9447c9569f20bca4b30d5892135f1efc) |
| 1 | obligation 0 opened: three excuses | obligee [`0x3c15…8CD7`](https://explorer-studio.genlayer.com/address/0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0x9983d759…d9f6`](https://explorer-studio.genlayer.com/tx/0x9983d759be04b6328a0216e82c7776db53ce6ef3f97f506c595d8118a444d9f6) |
| 2 | a stranger claims an excuse | stranger [`0xa898…3B34`](https://explorer-studio.genlayer.com/address/0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34) | `claim` | FINALIZED · MAJORITY_AGREE | refused: only the obligor may claim an excuse | [`0x782fb119…c4ba`](https://explorer-studio.genlayer.com/tx/0x782fb119b0623003c8a22e290bcbdc61d05d45e02542dbb2a44fb1133e30c4ba) |
| 3 | the obligor claims: a port strike | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0x0d9a74a3…60b7`](https://explorer-studio.genlayer.com/tx/0x0d9a74a398335d1873e747e5c43c7db8a2338ab9fb92eb332c8a8bf22e0b60b7) |
| 4 | a second claim while one waits | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `claim` | FINALIZED · MAJORITY_AGREE | refused: a claim is waiting for its ruling; either party may ask for it | [`0xc62b2b89…ae10`](https://explorer-studio.genlayer.com/tx/0xc62b2b895b0e5878146921f1bc64096d1c8ca3c27eef7569e6699b460ffcae10) |
| 5 | a stranger asks for the ruling | stranger [`0xa898…3B34`](https://explorer-studio.genlayer.com/address/0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34) | `rule` | FINALIZED · MAJORITY_AGREE | refused: only the obligee or the obligor may ask for a ruling | [`0xf0dab9ce…8e98`](https://explorer-studio.genlayer.com/tx/0xf0dab9cee6385cfcfd8df446a3644f1db6176f821c4a5851fc7cdbe8014f8e98) |
| 6 | ruled: both orders, every excuse | obligee [`0x3c15…8CD7`](https://explorer-studio.genlayer.com/address/0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0xda1149c9…9a6b`](https://explorer-studio.genlayer.com/tx/0xda1149c9694840f36292ae801337b324a6c844d9b590234f9ac67db854429a6b) |
| 7 | the same account again | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `claim` | FINALIZED · MAJORITY_AGREE | refused: this account was already ruled on; a new claim has to describe the event differently | [`0x519eb10d…8ec2`](https://explorer-studio.genlayer.com/tx/0x519eb10d7ee9cb716c97e641e8cf5e534cd3bcd93699d75d9386c760d7c48ec2) |
| 8 | the obligor claims: staff illness | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0xc1286853…6598`](https://explorer-studio.genlayer.com/tx/0xc1286853b99cab283065e9f60566f71ed00ac04b248c456015394260487c6598) |
| 9 | ruled: the unused excuses only | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `rule` | FINALIZED · MAJORITY_AGREE | executed | [`0x57e23a0b…c564`](https://explorer-studio.genlayer.com/tx/0x57e23a0bde1986d49733ccec22ebaf27c9b1e05492c6284cec3ac5346549c564) |
| 10 | a third claim | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `claim` | FINALIZED · MAJORITY_AGREE | refused: an obligation takes at most 2 claims | [`0x9ca55228…b204`](https://explorer-studio.genlayer.com/tx/0x9ca55228c8e1e8f85354560199e4c8b63c686729e6e16a1444423fb47a92b204) |
| 11 | obligation 0 kept | obligee [`0x3c15…8CD7`](https://explorer-studio.genlayer.com/address/0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7) | `fulfil` | FINALIZED · MAJORITY_AGREE | executed | [`0xe3336652…a177`](https://explorer-studio.genlayer.com/tx/0xe3336652df79b70c78e665524d57d1c9b7b4affd1ca5288e1f37ab39c189a177) |
| 12 | obligation 1 opened: five minutes | obligee [`0x3c15…8CD7`](https://explorer-studio.genlayer.com/address/0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0x411ef964…dd1c`](https://explorer-studio.genlayer.com/tx/0x411ef964376a0f51f1e8bcc80f4084acc0bbef6969067c552eeaaac0547fdd1c) |
| 13 | a breach recorded before the deadline | stranger [`0xa898…3B34`](https://explorer-studio.genlayer.com/address/0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34) | `lapse` | FINALIZED · MAJORITY_AGREE | refused: the deadline is 2026-10-02T19:37:57Z | [`0x4a3c8ed7…922f`](https://explorer-studio.genlayer.com/tx/0x4a3c8ed73c7a5dfeb6fa2a2cc5ccc400644564ca0b5650c0b635777672b3922f) |
| 14 | the obligor claims in time; nobody asks for the ruling | obligor [`0xe505…dfFf`](https://explorer-studio.genlayer.com/address/0xe5051Ff343d91aE303059A3CcB21Ca895E19dfFf) | `claim` | FINALIZED · MAJORITY_AGREE | executed | [`0xf3adc00c…049e`](https://explorer-studio.genlayer.com/tx/0xf3adc00cecc19739c0b1ec5c4c19efae807f932f5271a4f55ab7caaeaf1f049e) |
| 15 | a breach while the claim's grace window runs | stranger [`0xa898…3B34`](https://explorer-studio.genlayer.com/address/0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34) | `lapse` | FINALIZED · MAJORITY_AGREE | refused: a claim filed in time is waiting for its ruling until 2026-10-02T19:42:57Z | [`0x7d57dc42…630c`](https://explorer-studio.genlayer.com/tx/0x7d57dc42519ee4e79fde06aec06ec454e32f498673752bb555e487518605630c) |
| 16 | a ruling after the grace window closed | obligee [`0x3c15…8CD7`](https://explorer-studio.genlayer.com/address/0x3c1581EDa3F7Bb375ca44816CD6255AB091A8CD7) | `rule` | FINALIZED · MAJORITY_AGREE | refused: the grace window for the waiting claim closed at 2026-10-02T19:42:57Z; it can no longer be ruled on, and the obligation can only lapse | [`0x07b1914c…b3a0`](https://explorer-studio.genlayer.com/tx/0x07b1914c570c346b72ca577070d21324636b159d7b67c4176bc48d719a5fb3a0) |
| 17 | obligation 1 breached | stranger [`0xa898…3B34`](https://explorer-studio.genlayer.com/address/0xa89878E4ed005Ca2dB9E3747B6d27a75D9D73B34) | `lapse` | FINALIZED · MAJORITY_AGREE | executed | [`0x43ef9458…7b9a`](https://explorer-studio.genlayer.com/tx/0x43ef9458b3560eba7aa52e41241bc19867437dd85e37410c292246afcac97b9a) |
