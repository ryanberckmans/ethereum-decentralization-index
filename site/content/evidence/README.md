# Onchain evidence

`onchain.json` records every chain read behind the directory's reproduced observations (claims with state
`reproduced-observation`). `onchain.mjs` re-runs them. Nothing here is imported by the site.

## Verify

```sh
ETH_RPC_URL=https://<ethereum archive node> \
BASE_RPC_URL=https://<base archive node> \
node site/content/evidence/onchain.mjs
```

The script checks each pinned block hash, re-runs every read and prints `ok` or `MISMATCH` with both results. It exits
non-zero on any difference. Pass `--only <id>,<id>` to run some reads. It needs Node 22 and no packages; behind an HTTPS
proxy, add `NODE_USE_ENV_PROXY=1`.

Some providers cap `eth_getLogs` ranges below the default window of 1000 blocks. Set `LOG_WINDOW` to a smaller window,
or `LOG_RPC_URL_1` to a node that allows it, for example `LOG_RPC_URL_1=https://mainnet.gateway.tenderly.co`.

## How reads are pinned

Stocks are read at the first block at or after 00:00:00 UTC on their date, so "1 October 2026" means Ethereum block
26,093,738 and Base block 52,011,727. Flows cover whole UTC days: September 2026 is Ethereum blocks 25,878,705 to
26,093,737 inclusive. The `blocks` map records each pinned block's hash and timestamp.

| Kind | What it reads |
| --- | --- |
| `erc20.totalSupply` | `totalSupply()` and `decimals()` at the block |
| `erc20.balanceOf` | `balanceOf(holder)` and `decimals()` at the block |
| `eth.balance` | The address's native ETH balance at the block |
| `code.firstBlock` | The first block at which the address has code, by binary search |
| `call` | One `eth_call`; `signature` names the function, `returns` how the result is decoded |
| `seaport.orderFulfilled` | Every Seaport `OrderFulfilled` event in a block range, with counts for one token and one zone |

Results are exact: integers as decimal strings and token amounts with every digit. A Seaport read also records
`logsFingerprintSha256`, the SHA-256 of every matched log written as `block:logIndex:txHash` lines in chain order, so a
reproduction can show it read exactly the same events.

## What the numbers do and do not mean

- A token's total supply counts every unit on that contract, including units held by applications and bridges. It is
  not a count of people, payments or new money.
- A contract's token balance is what the contract holds. For a lending contract that is collateral plus what is
  supplied and not lent out, not total deposits. Balances of different contracts are parts of one supply and are never
  added to it.
- A Seaport `OrderFulfilled` event is one order filled. A matched trade emits one event for each of its orders, so
  fills are not trades, buyers or collectors. "Offered for an NFT" means the maker gave an ERC-20 token and received an
  ERC-721 or ERC-1155 item. WETH amounts are what makers spent, including fees paid out of it.
- A zone count includes every order that named the zone, through any interface.

## Adding a read

Add an entry to `reads` with an `id`, `chainId`, `block` (the pinned block, or the block after a flow's range) and a
`read`, then record it with `--only <id> --write`, which also pins any new block by hash. Cite the read from a claim in
`../claims.yaml`. Never use `--write` to replace a recorded result that no longer matches; investigate the mismatch.
