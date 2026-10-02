---
ediId: uniswap-v4
contentStatus: edited-profile
role: exchange
summary: Uniswap's 2025 exchange core. One contract holds every pool, pools can trade native ETH, and each pool can carry a hook that adds its own rules.
capability: >-
  Uniswap v4 keeps every pool in one contract, the PoolManager, and lets anyone create a pool that runs extra code
  through a hook, such as dynamic fees, automated liquidity management or an issuer's allowlist. Pools can hold native
  ETH directly, without wrapping it, and one hook can serve many pools.
authority: >-
  The PoolManager cannot be upgraded, and protocol fees cannot replace its custody or withdrawal logic. A pool's hook is
  fixed when the pool is created but can add its own rules, even for liquidity, so EDI reviews positions separately.
  Governance sets protocol fees on some pools.
economicTags: [token exchange, hooks, native ETH trading, liquidity pools, permissioned pools]
aliases: [Uniswap 4, Uniswap V4 PoolManager, PoolManager]
officialLinks:
  - label: Uniswap v4 documentation
    url: https://developers.uniswap.org/docs/protocols/v4/overview
    checkedAt: 2026-10-02
  - label: Uniswap v4 hooks
    url: https://developers.uniswap.org/docs/protocols/v4/concepts/hooks
    checkedAt: 2026-10-02
  - label: Uniswap v4 deployments
    url: https://developers.uniswap.org/docs/protocols/v4/deployments
    checkedAt: 2026-10-02
featuredObservationId: uniswap-v4-swaps-2026-09
editorialReviewedAt: 2026-10-02
---

## What it enables

Uniswap Labs launched v4 on 31 January 2025, on Ethereum and nine other networks at once {{claim:uniswap-v4-launch}}.
On Ethereum a single contract, the PoolManager, holds every v4 pool {{claim:uniswap-v4-deployments}}. It has had code
since 23 January 2025 {{claim:onchain-uniswap-cores-2026-10-01}}.

The new part is hooks. A hook is an optional contract attached to a pool when the pool is created. It cannot be added,
removed or swapped afterwards, and one hook can serve many pools {{claim:uniswap-v4-hooks-docs}}. At launch Uniswap
Labs described hooks as plugins for custom logic in pools, swaps, fees and liquidity positions. It also said that
creating a pool would cost up to 99.99% less than before, with further savings for pairs of native ETH
{{claim:uniswap-v4-launch-hooks-costs}}, since v4 pools can hold ETH itself instead of {{object:weth9}}.

Hooks let others build products with their own rules on the same core. Uniswap Labs announced Permissioned Pools in
July 2026: a shared hook checks that a wallet is approved before it can swap or add liquidity, and the token's issuer
keeps the list of approved wallets {{claim:uniswap-permissioned-pools-announced}}. On 24 August 2026 it said the
standard was live on Ethereum {{claim:uniswap-permissioned-pools-live}}.

## Observed use

In September 2026 the PoolManager recorded {{obs:uniswap-v4-swaps-2026-09}} across
{{obs:uniswap-v4-pools-swapped-2026-09}} {{claim:onchain-uniswap-v4-swaps-2026-09}}. Pools that pair native ETH
accounted for {{obs:uniswap-v4-native-eth-swaps-2026-09}}. Pools with a hook accounted for
{{obs:uniswap-v4-hooked-swaps-2026-09}}, run by {{obs:uniswap-v4-hooks-used-2026-09}}. A swap event is one step through
one pool, so events are not trades or traders.

Creating a pool is open to anyone. By 1 October 2026, {{obs:uniswap-v4-pools-2026-10-01}} had been created on Ethereum,
{{obs:uniswap-v4-hooked-pools-2026-10-01}} of them with a hook. Permissioned Pools had barely started: Uniswap's shared
PermissionedHooks contract {{claim:uniswap-permissioned-pools-addresses}} served {{obs:permissioned-pools-2026-10-01}},
which recorded {{obs:permissioned-pools-swaps-2026-09}} in September. Pools using an issuer's own copy of the hook are
not counted.

At the same moment the PoolManager held {{obs:eth-held-by-uniswap-v4-2026-10-01}} and
{{obs:weth9-held-by-uniswap-v4-2026-10-01}} {{claim:onchain-core-balances-2026-10-01}}, along with
{{obs:usdc-held-by-uniswap-v4-2026-10-01}} {{claim:onchain-usdc-in-cores-2026-10-01}}. These are the contract's balances
of each token, not liquidity in any particular pool.

## Control in context

The PoolManager is {{grade:uniswap-v4}} in EDI. The assessment covers the contract on Ethereum at
0x000000000004444c5dc75cB358380D2e3dE08A90 {{claim:uniswap-v4-deployments}}, whose custody and settlement code cannot
be upgraded. Deployments on other networks are separate.

A position in a v4 pool depends on more than the core. Its hook can change how swaps and liquidity work in that pool,
and its tokens keep their issuers' controls. EDI reviews these dependencies for each position and has not resolved
them, so a v4 position is shown as {{grade:uniswap-v4:position}}. In a permissioned pool, for example, the issuer
cannot move positions or take funds directly, but it can replace the contract that decides who may trade and can pause
swapping of its token {{claim:uniswap-permissioned-pools-architecture}}.

Protocol fees are set by governance. The PoolManager's owner is the governance Timelock, which appoints the protocol
fee controller; on 1 October 2026 that was the V4FeeAdapter, also owned by the Timelock
{{claim:onchain-uniswap-fees-2026-10-01}}. Governance proposal 100 turned on v4 protocol fees on Ethereum for three
families of pools, one of them pools without hooks, and for no other v4 pools {{claim:uniswap-v4-fees-proposal}}.
Governance acts through UNI, the Uniswap token, which EDI assesses separately as {{grade:token:uniswap}}.
