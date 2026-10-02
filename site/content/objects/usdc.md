---
ediId: usdc
contentStatus: edited-profile
role: dollar-token
summary: Circle's dollar token on Ethereum, redeemable through Circle and usable by any application that accepts ERC-20 tokens.
capability: >-
  USDC lets dollars move and settle on Ethereum like any other token, between people, applications and institutions.
  Anyone can build on it without Circle's permission: a card network takes settlement in it over Ethereum, and fixed
  exchange and lending cores hold it as ordinary liquidity.
authority: >-
  Circle issues and redeems USDC and holds its reserves off-chain. It can block any address from sending or receiving
  USDC, pause all transfers and upgrade the contract's logic. Redeeming directly with Circle requires a Circle Mint
  account.
economicTags: [dollar settlement, stablecoin, card settlement, cross-border payments, trading and lending liquidity]
aliases: [USD Coin, Circle USDC, USDC on Ethereum]
officialLinks:
  - label: USDC (Circle)
    url: https://www.circle.com/usdc
    checkedAt: 2026-10-02
  - label: USDC contract addresses
    url: https://developers.circle.com/stablecoins/usdc-contract-addresses
    checkedAt: 2026-10-02
  - label: Reserves and circulation (Circle transparency)
    url: https://www.circle.com/transparency
    checkedAt: 2026-10-02
  - label: USDC Terms
    url: https://www.circle.com/legal/usdc-terms
    checkedAt: 2026-10-02
featuredObservationId: usdc-supply-ethereum-2026-10-01
editorialReviewedAt: 2026-10-02
---

## What it enables

{{object:usdc}} is a claim on US dollars that moves like any other Ethereum token. Circle issues it against US
dollar-denominated reserve assets held in segregated accounts and commits to redeem 1 USDC for 1 dollar under its terms
{{claim:circle-usdc-terms}}. Once issued, USDC can be sent to any address, held by any wallet or contract and accepted
by any application: Circle states that third parties can support it without authorization or approval from Circle or
anyone else {{claim:circle-usdc-open-integration}}.

That openness brought card settlement onto public infrastructure. In 2021 Visa settled a transaction in USDC over
Ethereum in a pilot with Crypto.com {{claim:visa-usdc-pilot-2021}}. By 2023 Crypto.com was using USDC to meet its
Visa card settlement obligations in Australia. Where cross-border purchases had needed a days-long currency conversion
and international wires, it could send USDC over Ethereum directly to a Circle account managed by Visa's treasury
{{claim:visa-usdc-ethereum-settlement-2023}}.

The same token is ordinary liquidity for programs. Fixed exchange and lending cores hold USDC beside every other token,
so a trader, a lender or another contract can use dollars without an account at any of them.

## Observed use

USDC's supply on Ethereum was {{obs:usdc-supply-ethereum-2026-10-01}} {{claim:onchain-usdc-2026-10-01}}. That counts
every unit on the Ethereum contract, including USDC held by applications and bridges, and is not a count of payments
or people.

Some of it sits in fixed cores: the Morpho Blue lending contract held {{obs:usdc-held-by-morpho-blue-2026-10-01}} not
lent out, and the Uniswap v4 PoolManager held {{obs:usdc-held-by-uniswap-v4-2026-10-01}}
{{claim:onchain-usdc-in-cores-2026-10-01}}. Both are part of the supply above, not additions to it.

Circle reports figures across every chain it issues on: {{obs:usdc-circulation-2026-09-24}} in circulation, with
{{obs:usdc-issued-365d-2026-09-24}} issued and {{obs:usdc-redeemed-365d-2026-09-24}} redeemed over the previous 365 days
{{claim:circle-transparency-2026-09}}. These are not Ethereum figures, and the flows say how much Circle issued and
redeemed, not how much moved between holders.

Visa reports its stablecoin settlement as an annualized run rate across every chain and stablecoin it supports:
{{obs:visa-stablecoin-run-rate-2025-11}} {{claim:visa-us-settlement-2025}}, then {{obs:visa-stablecoin-run-rate-2026-04}}
across nine chains, Ethereum among them {{claim:visa-nine-chains-2026}}. Visa gives no Ethereum-only figure, so neither
number measures settlement on Ethereum, and a run rate is not a year of realized volume.

## Control in context

USDC is {{grade:usdc}} in EDI. The powers sit with Circle: its USDC Terms reserve the right to block transfers to and
from any address on chain {{claim:circle-usdc-blocklisting}}, and the contract's design gives Circle every
administrative role, including minting, pausing all transfers, blocking addresses and replacing the contract's logic
{{claim:circle-fiattoken-design}}. Only holders with a Circle Mint account can redeem directly with Circle; everyone
else relies on someone who can {{claim:circle-usdc-redemption-access}}.

These controls apply to the token wherever it is held, including inside a fixed exchange or lending core. A core's own
rules can be immutable while the USDC in it can still be blocked by its issuer.

EDI's record covers USDC on Ethereum at 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48. Circle's USDC on other networks,
such as {{subject:deployment:usdc-base}}, is a separate contract {{claim:circle-usdc-addresses}}, and bridged versions of
USDC add the bridge's own controls.
