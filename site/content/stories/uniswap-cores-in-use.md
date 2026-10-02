---
id: uniswap-cores-in-use
title: Uniswap cores in use
dek: >-
  Uniswap has released four exchange cores since 2018, each beside the last rather than in its place. All four still
  run on Ethereum, and even the 2018 original carried thousands of swaps in September 2026.
thesis: >-
  Exchange cores that no one can change keep working after their successors arrive: Uniswap's v1 core from 2018 still
  recorded thousands of swaps on Ethereum in September 2026, while the v3 and v4 cores each recorded millions.
objectIds: [uniswap-v1, uniswap-v2, uniswap-v3, uniswap-v4, token:uniswap]
contextualSubjectIds: [org:uniswap-labs]
collections: [d0-in-use]
outcome:
  mechanism: liquidity-access
  state: reproduced-observation
  statement: >-
    In September 2026 Uniswap's cores on Ethereum recorded 13,763 swap events in 187 v1 exchanges, 4,121,099 in 11,876
    v3 pools and 3,731,479 in 16,146 v4 pools.
ethereumContribution: >-
  Ethereum keeps each version's contracts running at their original addresses, so a new design arrives next to the old
  ones instead of replacing them. Liquidity providers and traders choose the version that suits them, and none of them
  has to move when a new one launches.
controlBoundary: >-
  No one can upgrade the pool code in any version, but Uniswap governance, voting with UNI, controls protocol fees in
  v2, v3 and v4 and has switched them on. Each token keeps its issuer's controls, and a v4 pool's hook can add rules of
  its own.
claimIds:
  - uniswap-v1-launch-2018
  - onchain-uniswap-v1-2026-10-01
  - uniswap-v2-overview-pairs
  - uniswap-v2-launch
  - uniswap-v3-intro-idle-capital
  - uniswap-v3-launch
  - uniswap-v4-launch
  - uniswap-v4-hooks-docs
  - uniswap-v1-without-upkeep
  - onchain-uniswap-cores-2026-10-01
  - uniswap-v2-flash-swaps-docs
  - uniswap-2020-flash-swaps-volume
  - uniswap-2020-oracle-integrations
  - onchain-uniswap-v1-swaps-2026-09
  - onchain-uniswap-v3-swaps-2026-09
  - onchain-uniswap-v4-swaps-2026-09
  - uniswap-v2-flash-swaps-arbitrage
  - uniswap-2020-review-v2
  - uniswap-unification-executed
  - uniswap-fees-live-v2-v3
  - uniswap-v4-fees-proposal
  - onchain-uniswap-fees-2026-10-01
  - uniswap-governance-timelock-docs
observationIds:
  - uniswap-v1-pools-2026-10-01
  - uniswap-v2-pools-2026-10-01
  - uniswap-v3-pools-2026-10-01
  - uniswap-v4-pools-2026-10-01
  - v2-flash-swaps-2020
  - v2-oracle-integrations-2020
  - uniswap-v1-pools-swapped-2026-09
  - uniswap-v1-swaps-2026-09
  - uniswap-v3-pools-swapped-2026-09
  - uniswap-v3-swaps-2026-09
  - uniswap-v4-pools-swapped-2026-09
  - uniswap-v4-swaps-2026-09
  - uniswap-v4-native-eth-swaps-2026-09
relationshipIds: []
reviewedAt: 2026-10-02
---

## Before

{{object:uniswap-v1}} launched in November 2018 as a proof of concept for automated market makers, exchanges in which
anyone can pool assets into a shared market and trade against it {{claim:uniswap-v1-launch-2018}}. Its factory has had
code on Ethereum since 2 November 2018 {{claim:onchain-uniswap-v1-2026-10-01}}. The design had limits. Every v1 pool
paired ETH with a single token, so a trade between two other tokens, such as DAI for USDC, went through ETH and paid
fees and slippage in two pools {{claim:uniswap-v2-overview-pairs}}. No one could fix that by changing v1: EDI's review
finds no administrator able to replace its exchange code.

## The mechanism

Uniswap improved by adding cores rather than changing them. {{object:uniswap-v2}} went live on 18 May 2020
{{claim:uniswap-v2-launch}} with pools for any two tokens {{claim:uniswap-v2-overview-pairs}}. Its pools spread liquidity
across every price from zero to infinity, so in most pools most of it was never used, and {{object:uniswap-v3}} let
providers concentrate it within price ranges they choose {{claim:uniswap-v3-intro-idle-capital}}, from 5 May 2021
{{claim:uniswap-v3-launch}}. {{object:uniswap-v4}} followed on 31 January 2025 {{claim:uniswap-v4-launch}}, with every
pool in one contract and optional hooks that let a pool run its own logic {{claim:uniswap-v4-hooks-docs}}.

The old cores stayed where they were. When v2 arrived, Uniswap Labs wrote that v1 functions without upkeep and will
continue to work for as long as Ethereum exists {{claim:uniswap-v1-without-upkeep}}. Each core keeps its own pools, and
anyone can open a pool in any of them. By 1 October 2026 the v1 factory had created
{{obs:uniswap-v1-pools-2026-10-01}} {{claim:onchain-uniswap-v1-2026-10-01}}, the v2 factory
{{obs:uniswap-v2-pools-2026-10-01}} and the v3 factory {{obs:uniswap-v3-pools-2026-10-01}}, and
{{obs:uniswap-v4-pools-2026-10-01}} had been created in v4 {{claim:onchain-uniswap-cores-2026-10-01}}. These count
markets created, not markets in use.

## Evidence of use

Developers built on the cores quickly. Within months of v2's launch they were using its flash swaps, which let a
contract take a pool's tokens and pay for them before its transaction ends {{claim:uniswap-v2-flash-swaps-docs}}.
Uniswap Labs' account of 2020 put flash-swap volume since May at {{obs:v2-flash-swaps-2020}}
{{claim:uniswap-2020-flash-swaps-volume}}, and counted {{obs:v2-oracle-integrations-2020}}, Compound and Augur v2 among
them, using v2's price oracle {{claim:uniswap-2020-oracle-integrations}}. Both are Uniswap Labs' own figures, published
without a method.

The cores are still in use years later, the oldest included. In September 2026,
{{obs:uniswap-v1-pools-swapped-2026-09}} of v1's exchanges recorded {{obs:uniswap-v1-swaps-2026-09}}
{{claim:onchain-uniswap-v1-swaps-2026-09}}. In v3, {{obs:uniswap-v3-pools-swapped-2026-09}} recorded
{{obs:uniswap-v3-swaps-2026-09}} {{claim:onchain-uniswap-v3-swaps-2026-09}}, and in v4,
{{obs:uniswap-v4-pools-swapped-2026-09}} recorded {{obs:uniswap-v4-swaps-2026-09}}
{{claim:onchain-uniswap-v4-swaps-2026-09}}. A swap event is one step through one pool, so a trade routed through several
pools counts several times, and events are not traders. Each version's count stands alone.

## What becomes possible

A core that stays put becomes a building block. Uniswap's documentation gives arbitrage without capital as a use of
flash swaps: a trader without funds can take tokens from a pool, sell them for more elsewhere and repay the pool in the
same transaction, paying only gas {{claim:uniswap-v2-flash-swaps-arbitrage}}. Other contracts can read a v2 pool's
time-weighted average price {{claim:uniswap-2020-review-v2}}.

New designs can try new things without moving anyone. Uniswap v4 pools can pair native ETH without wrapping it, and
those pools recorded {{obs:uniswap-v4-native-eth-swaps-2026-09}} {{claim:onchain-uniswap-v4-swaps-2026-09}} without
changing how any older pool trades.

## What remains controlled

EDI assesses each core separately: v1 is {{grade:uniswap-v1}}, v2 {{grade:uniswap-v2}}, v3 {{grade:uniswap-v3}} and
the v4 PoolManager {{grade:uniswap-v4}}. None of these grades covers the tokens in a pool, copies of the code on other
networks, or Uniswap as a brand. Around the cores:

- Governance controls protocol fees in v2, v3 and v4, and has turned them on. The UNIfication proposal passed and was
  executed {{claim:uniswap-unification-executed}}; fees were live on all v2 and v3 pools by July 2026
  {{claim:uniswap-fees-live-v2-v3}}, and proposal 100 turned them on for three families of v4 pools
  {{claim:uniswap-v4-fees-proposal}}. On 1 October 2026 the governance Timelock {{claim:uniswap-governance-timelock-docs}}
  held every one of those fee settings, directly or through fee contracts it owned
  {{claim:onchain-uniswap-fees-2026-10-01}}.
- Governance acts through UNI, the Uniswap token, which EDI assesses separately as {{grade:token:uniswap}}. Holding
  UNI is not using the exchange.
- A v4 pool's hook can change how swaps and liquidity work in that pool, and EDI has not resolved those dependencies,
  so a v4 position is {{grade:uniswap-v4:position}}.
- Every token in a pool keeps whatever controls its issuer built into it.
