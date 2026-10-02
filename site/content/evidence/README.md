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

Long scans use `LOG_RPC_URL_<chainId>` when it is set, for example `LOG_RPC_URL_1=https://mainnet.gateway.tenderly.co`,
and otherwise the chain's own URL. Some providers cap `eth_getLogs` ranges; set `LOG_WINDOW` to a smaller window of
blocks. `BATCH` (default 10) sets how many requests go in one JSON-RPC batch and `WORKERS` (default 4) how many run at
once; lower both for a rate-limited node. The largest scans, a month of Uniswap v2 or v3 swaps, take about an hour.

## How reads are pinned

A stock dated D is the state at 00:00 UTC on D: it is read at the last block before midnight, so "1 October 2026" means
the state after Ethereum block 26,093,737 or Base block 52,011,726. A flow covers every block whose timestamp falls in
its period: September 2026 is Ethereum blocks 25,878,705 to 26,093,737 inclusive. The two reconcile exactly: USDC's
supply on 1 October minus its supply on 1 September equals September's mints minus its burns. The `blocks` map records
the hash and timestamp of every block a read depends on.

| Kind | What it reads |
| --- | --- |
| `erc20.totalSupply` | `totalSupply()` and `decimals()` at the block |
| `erc20.balanceOf` | `balanceOf(holder)` and `decimals()` at the block |
| `eth.balance` | The address's native ETH balance at the block |
| `code.firstBlock` | The first block at which the address has code, by binary search |
| `call` | One `eth_call`; `signature` names the function, `returns` how the result is decoded |
| `logs.count` | Every log from one address with given topics in a block range |
| `erc20.transfers` | A token's `Transfer` events in a block range: mints (from the zero address), burns (to it) and transfers between holders, with totals |
| `token.frozen` | Every freeze (or blocklisting), unfreeze and balance wipe a token's issuer has made, and how many addresses the token still reports as frozen at the block |
| `blocks.summary` | Every block in a range: transactions, gas used, base fee burned (base fee × gas used) and blob fee burned (blob base fee from `eth_feeHistory` × blob gas used) |
| `uniswap.pairSwaps` | Uniswap v2 or v3 `Swap` events in a range, kept only when the emitting contract is the factory's own pool for its tokens (`getPair` or `getPool`), so forks are excluded |
| `uniswap.v4Swaps` | Pools initialized in the v4 PoolManager and its `Swap` events in a range, split by whether a pool has a hook or pairs native ETH, with named hooks counted separately |
| `morpho.market` | One Morpho Blue market's parameters and its stored supply and borrow totals |
| `morpho.loanToken` | Morpho Blue markets created and those lending one token, their stored totals, and their `Borrow` events in a range |
| `morpho.marketBorrows` | `Borrow` events in one Morpho Blue market in a range |
| `seaport.orderFulfilled` | Every Seaport `OrderFulfilled` event in a block range, with counts for one token and one zone |
| `fiattoken.events` | Every `Mint`, `Burn`, `Blacklisted` and `UnBlacklisted` event of a FiatToken contract such as USDC, with mints and burns split into named groups of minters |

Results are exact: integers as decimal strings and token amounts with every digit. Every read that scans logs also
records a fingerprint (`logsFingerprintSha256` or a named variant), the SHA-256 of every matched log written as
`block:logIndex:txHash` lines in chain order, so a reproduction can show it read exactly the same events.

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
- A Uniswap `Swap` event is one step through one pool. A trade routed through several pools emits several, so events
  are not trades or traders. Pools created count markets anyone opened, not markets in use.
- A Morpho `Borrow` event is a loan drawn. Amounts borrowed over a period are gross: repayments are not subtracted and
  a refinanced loan counts again, so they are not loans outstanding. A market's stored totals are its own accounting.
- Mints and burns of a token that moves between networks by burning and minting include those moves, so they are not
  all issuance and redemption.

## Adding a read

Add an entry to `reads` with an `id`, `chainId`, `block` (the block read, or the last block of a range) and a
`read`, then record it with `--only <id> --write`, which also pins any new block by hash. Cite the read from a claim in
`../claims.yaml`. Never use `--write` to replace a recorded result that no longer matches; investigate the mismatch.
