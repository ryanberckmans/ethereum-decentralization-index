---
id: fund-shares-onchain-liquidity
title: Fund shares and onchain liquidity
dek: >-
  Shares of BlackRock's BUIDL fund move between approved investors on Ethereum at any hour. The trading announced for
  them through UniswapX did not show up among September's transfers on Ethereum.
thesis: >-
  Tokenized fund shares gain new connections one at a time, and each needs its own evidence: BUIDL settles between
  approved holders on Ethereum, while its announced trading through UniswapX names no network and left no trace in
  BUIDL's Ethereum transfers in September 2026.
objectIds: [buidl, uniswap-v4]
contextualSubjectIds:
  - org:blackrock
  - org:securitize
  - org:crypto-com
  - product:uniswapx
  - product:uniswap-permissioned-pools
  - deployment:buidl-i-ethereum
collections: [global-economy]
outcome:
  mechanism: liquidity-access
  state: announced
  statement: >-
    Uniswap Labs and Securitize said in February 2026 that whitelisted investors could trade BUIDL with whitelisted
    market makers through UniswapX. All 33 transfers between BUIDL holders on Ethereum in September 2026 went directly
    to the token contract instead.
ethereumContribution: >-
  Ethereum holds BUIDL's first share class and its I Class as tokens, with a public record of every issue, burn and
  transfer. Approved holders can send shares to each other at any hour, and any application that checks the same
  approvals can work with them.
controlBoundary: >-
  BlackRock manages the fund, and Securitize, its transfer agent, decides who may hold or receive the tokens. Trading
  through UniswapX adds Securitize's whitelist and approved market makers; in a permissioned Uniswap pool, the issuer
  keeps the allowlist and can pause swapping.
claimIds:
  - buidl-service-providers
  - buidl-launch-2024
  - buidl-design-2024
  - buidl-share-classes-2024
  - buidl-solana-2025
  - buidl-token-addresses
  - buidl-collateral-exchanges-2025
  - buidl-collateral-binance-2025
  - buidl-uniswapx-2026
  - onchain-buidl-2026-09
  - onchain-buidl-holder-transfers-2026-09
  - uniswap-permissioned-pools-announced
  - uniswap-permissioned-pools-live
  - onchain-permissioned-pool-2026-10-01
  - uniswap-permissioned-pools-architecture
observationIds:
  - buidl-holder-transfer-volume-2026-09
  - buidl-holder-transfers-2026-09
  - buidl-minted-2026-09
  - buidl-burned-2026-09
  - buidl-supply-2026-10-01
  - buidl-holder-transfer-senders-2026-09
  - buidl-holder-transfer-receivers-2026-09
  - permissioned-pools-2026-10-01
  - permissioned-pools-swaps-2026-09
relationshipIds: []
reviewedAt: 2026-10-02
---

## Before

A fund share usually exists as an entry in a register kept by the fund's transfer agent, which records every
subscription, redemption and distribution. BlackRock had issued no fund on a public blockchain until March 2024, when it
announced BUIDL, the BlackRock USD Institutional Digital Liquidity Fund, through which qualified investors earn US
dollar yields {{claim:buidl-launch-2024}}. Securitize, its transfer agent, still keeps that record, now as tokens
{{claim:buidl-service-providers}}.

## The mechanism

{{object:buidl}}'s shares are tokens. At launch the fund sought a stable value of 1 dollar per token and invested in cash,
US Treasury bills and repurchase agreements. Dividends accrue daily and arrive monthly as new tokens, and holders can
transfer tokens at any hour, but only to other pre-approved investors {{claim:buidl-design-2024}}. Each network has its
own share class and contract: BUIDL began on Ethereum, added Aptos, Arbitrum, Avalanche, OP Mainnet and Polygon in
November 2024 {{claim:buidl-share-classes-2024}}, and then Solana {{claim:buidl-solana-2025}}. On Ethereum BlackRock lists
two addresses {{claim:buidl-token-addresses}}: one reports the symbol BUIDL and is the one the directory's BUIDL figures
read, and the other is {{subject:deployment:buidl-i-ethereum}}.

Other companies have announced uses for the tokens. Crypto.com and Deribit said in June 2025 that they would accept BUIDL
as collateral {{claim:buidl-collateral-exchanges-2025}}, and Binance followed in November 2025 for collateral held off
the exchange {{claim:buidl-collateral-binance-2025}}. In February 2026 Uniswap Labs and Securitize said BUIDL could be
traded through {{subject:product:uniswapx}}: investors pre-qualified and whitelisted through Securitize request quotes
from whitelisted market makers, and each trade settles atomically on chain {{claim:buidl-uniswapx-2026}}. UniswapX is a
quote-based trading system, not a Uniswap v4 pool, and none of these announcements names the network or share class.

## Evidence of use

On Ethereum the shares move between holders. In September 2026 holders of the BUIDL contract moved
{{obs:buidl-holder-transfer-volume-2026-09}} among themselves in {{obs:buidl-holder-transfers-2026-09}}, while the
contract issued {{obs:buidl-minted-2026-09}}, for subscriptions and dividends alike, and burned
{{obs:buidl-burned-2026-09}} {{claim:onchain-buidl-2026-09}}. Its supply stood at {{obs:buidl-supply-2026-10-01}} on 1
October.

None of those transfers was a trade through another contract. Each was a transaction sent straight to the token
contract, passing among a few addresses: {{obs:buidl-holder-transfer-senders-2026-09}} sent them and
{{obs:buidl-holder-transfer-receivers-2026-09}} received them {{claim:onchain-buidl-holder-transfers-2026-09}}. A trade
through UniswapX, or through any exchange pool, would have been sent to that system's contract instead. In the I Class,
most transfers between holders went through a Safe multisig, and the rest through Securitize's SecuritizeOnRamp contract
or directly. The announced trading and collateral uses may run on other networks or share classes, or off chain; the
directory has not observed them on Ethereum.

## What becomes possible

A token that only approved investors may hold can still meet an onchain market if the market checks approval itself.
Uniswap Labs announced Permissioned Pools in July 2026, with Securitize among the launch partners: a Uniswap v4 hook
standard in which the pool checks that a wallet is approved before each swap or liquidity action, while the issuer
keeps the allowlist {{claim:uniswap-permissioned-pools-announced}}. Uniswap Labs said the standard was live on Ethereum
in August 2026 {{claim:uniswap-permissioned-pools-live}}.

Use had barely begun. By 1 October 2026 Uniswap's shared hook served {{obs:permissioned-pools-2026-10-01}} on Ethereum,
which recorded {{obs:permissioned-pools-swaps-2026-09}} in September. It trades a token named THING against USDC, not
BUIDL, and no published source names its issuer {{claim:onchain-permissioned-pool-2026-10-01}}.

## What remains controlled

BUIDL is {{grade:buidl}} in EDI, whose review finds that fund ownership and redemption depend on BlackRock, Securitize
and the rules on who may hold the tokens. Every connection adds its own conditions:

- Securitize manages the tokenized shares as transfer agent {{claim:buidl-service-providers}}, and the tokens can move
  only to pre-approved investors {{claim:buidl-design-2024}}.
- Trading through UniswapX needs whitelisting through Securitize and a quote from a whitelisted market maker
  {{claim:buidl-uniswapx-2026}}.
- In a permissioned pool the issuer cannot move positions or take funds directly, but it can replace the contract that
  decides who may trade and can pause swapping of its token {{claim:uniswap-permissioned-pools-architecture}}. The v4
  PoolManager is {{grade:uniswap-v4}}, while a v4 position, which also depends on its hook and tokens, is
  {{grade:uniswap-v4:position}}.
- Each network's share class, and each exchange or custodian that holds BUIDL as collateral, keeps controls of its own.
