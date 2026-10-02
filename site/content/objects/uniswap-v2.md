---
ediId: uniswap-v2
contentStatus: edited-profile
role: exchange
summary: Uniswap's 2020 exchange core. Anyone can open a pool for two tokens and trade against it, under pool code that no one can upgrade.
capability: >-
  Uniswap v2 lets anyone create a pool for any two ERC-20 tokens, add liquidity to it and trade against it at a price
  set by the pool's reserves. Each pool also keeps a time-weighted average price that other contracts can read, and
  flash swaps let a contract use a pool's tokens and pay for them before its transaction ends.
authority: >-
  No one can upgrade a pool or stop liquidity providers from withdrawing. Uniswap governance controls only the protocol
  fee, which it has turned on for every pool, and the tokens traded keep their own issuers' controls.
economicTags: [token exchange, liquidity pools, price oracle, flash swaps]
aliases: [Uniswap 2, Uniswap V2 pairs, UniswapV2Factory]
officialLinks:
  - label: Uniswap v2 documentation
    url: https://developers.uniswap.org/docs/protocols/v2/overview
    checkedAt: 2026-10-02
  - label: Uniswap v2 deployments
    url: https://developers.uniswap.org/docs/protocols/v2/deployments
    checkedAt: 2026-10-02
  - label: Uniswap v2 launch post (Uniswap Labs)
    url: https://blog.uniswap.org/launch-uniswap-v2
    checkedAt: 2026-10-02
featuredObservationId: uniswap-v2-pools-2026-10-01
editorialReviewedAt: 2026-10-02
---

## What it enables

Uniswap v2 went live on Ethereum on 18 May 2020 {{claim:uniswap-v2-launch}}. It opened pools for any pair of ERC-20
tokens and added a time-weighted average price oracle and flash swaps {{claim:uniswap-2020-review-v2}}. Anyone can
create a pool, deposit both tokens as liquidity and trade against it, with no listing decision by anyone. By
1 October 2026 the v2 factory on Ethereum had created {{obs:uniswap-v2-pools-2026-10-01}}
{{claim:onchain-uniswap-cores-2026-10-01}}. That counts markets created, not markets in use.

Flash swaps let a contract withdraw up to a pool's full reserves of a token and run any logic, provided it pays with
the pool's other token, or returns the tokens with a fee, before the transaction ends
{{claim:uniswap-v2-flash-swaps-docs}}. Uniswap's documentation gives arbitrage without capital as the example: a trader
can take tokens from a pool, sell them for more elsewhere and repay the pool in one transaction, paying only gas
{{claim:uniswap-v2-flash-swaps-arbitrage}}.

## Observed use

The first year showed both features in use. Uniswap Labs reported at the end of 2020 that flash swaps had handled
{{obs:v2-flash-swaps-2020}} of volume since v2's launch {{claim:uniswap-2020-flash-swaps-volume}}, and that
{{obs:v2-oracle-integrations-2020}}, Compound and Augur v2 among them, had integrated the price oracle
{{claim:uniswap-2020-oracle-integrations}}. Both are Uniswap Labs' own figures, published without a method or a chain;
the directory found no Uniswap deployment outside Ethereum at the time.

## Control in context

The v2 core is {{grade:uniswap-v2}} in EDI. The assessment covers the pools of the v2 factory on Ethereum at
0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f {{claim:uniswap-v2-deployments}}. Copies on other networks, and forks of the
code, are separate. EDI's review finds that governance can configure the protocol fee but cannot upgrade a pool or
block a liquidity provider's exit.

That fee is now on. Uniswap governance passed and executed the UNIfication proposal
{{claim:uniswap-unification-executed}}. On 1 October 2026 the v2 factory named the TokenJar fee contract as the
fee's recipient, and the governance Timelock as the account that can change it {{claim:onchain-uniswap-fees-2026-10-01}}.
The switch covers every v2 pool at once: while it is on, liquidity providers receive 0.25% of each trade instead of
0.30%, and the protocol takes 0.05% {{claim:uniswap-unification-proposal}}. Governance acts through UNI, the Uniswap
token, which EDI assesses separately as {{grade:token:uniswap}}. The tokens in each pool keep their own issuers'
controls.
