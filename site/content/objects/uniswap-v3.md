---
ediId: uniswap-v3
contentStatus: edited-profile
role: exchange
summary: Uniswap's 2021 exchange core, where each liquidity provider chooses the price range their funds serve. No one can upgrade its pools.
capability: >-
  Uniswap v3 lets a liquidity provider place funds within a price range they choose instead of across every possible
  price, so capital can sit where trading happens. Anyone can open a pool for two ERC-20 tokens at one of several fee
  tiers, and each liquidity position is represented by an NFT.
authority: >-
  No one can upgrade a pool or stop liquidity providers from withdrawing. Uniswap governance holds bounded protocol-fee
  powers, used through a fee contract it owns, and the tokens traded keep their own issuers' controls.
economicTags: [token exchange, concentrated liquidity, liquidity pools, market making]
aliases: [Uniswap 3, Uniswap V3 pools, UniswapV3Factory]
officialLinks:
  - label: Uniswap v3 documentation
    url: https://developers.uniswap.org/docs/protocols/v3/overview
    checkedAt: 2026-10-02
  - label: Uniswap v3 deployments on Ethereum
    url: https://developers.uniswap.org/docs/protocols/v3/deployments/v3-ethereum-deployments
    checkedAt: 2026-10-02
  - label: Uniswap v3 launch post (Uniswap Labs)
    url: https://blog.uniswap.org/launch-uniswap-v3
    checkedAt: 2026-10-02
featuredObservationId: uniswap-v3-swaps-2026-09
editorialReviewedAt: 2026-10-02
---

## What it enables

Uniswap v3 went live on Ethereum on 5 May 2021 {{claim:uniswap-v3-launch}}. Its defining idea is concentrated
liquidity: a liquidity provider places funds within a price range of their choosing, where earlier versions spread
every deposit across all prices {{claim:uniswap-v3-concentrated-liquidity-docs}}. A provider can put capital where
trades actually happen instead of holding it in reserve for prices that may never come.

Pools come in several fee tiers, and each provider's position, with its own range, is represented by an NFT
{{claim:uniswap-v3-launch-positions}}. As with v2, anyone can open a pool without asking anyone. By 1 October 2026 the
v3 factory on Ethereum had created {{obs:uniswap-v3-pools-2026-10-01}} {{claim:onchain-uniswap-cores-2026-10-01}}.

## Observed use

In September 2026 the pools of the v3 factory recorded {{obs:uniswap-v3-swaps-2026-09}}, spread over
{{obs:uniswap-v3-pools-swapped-2026-09}} with at least one swap {{claim:onchain-uniswap-v3-swaps-2026-09}}. A swap event
is one step through one pool. A trade routed through several pools emits several, so events are not trades or
traders. Forks of the code that emit the same event are not counted.

## Control in context

The v3 core is {{grade:uniswap-v3}} in EDI. The assessment covers the pools of the v3 factory on Ethereum at
0x1F98431c8aD98523631AE4a59f267346ea31F984 {{claim:uniswap-v3-deployments}}. Deployments on other networks, and forks,
are separate. EDI's review finds that governance has bounded protocol-fee powers, while pool code and the logic that
returns liquidity providers' principal cannot be upgraded.

Those fee powers are in use. On 1 October 2026 the v3 factory was owned by the V3OpenFeeAdapter, one of Uniswap's
protocol fee contracts {{claim:uniswap-fee-contracts-docs}}, which the governance Timelock owned in turn
{{claim:onchain-uniswap-fees-2026-10-01}}. Uniswap Labs said in July 2026 that protocol fees were live on all v2 and v3
pools {{claim:uniswap-fees-live-v2-v3}}. Governance acts through UNI, the Uniswap token, which EDI assesses separately as
{{grade:token:uniswap}}. The tokens in each pool keep their own issuers' controls.
