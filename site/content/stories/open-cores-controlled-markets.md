---
id: open-cores-controlled-markets
title: Open cores, controlled markets
dek: >-
  Uniswap v4 runs every pool in one contract that no one can upgrade, yet a pool's hook can decide who may trade in it.
  The first pool on Uniswap's shared hook for approved wallets opened on Ethereum in September 2026.
thesis: >-
  A fixed exchange core can host markets with different access rules side by side: Uniswap v4 pools open to anyone
  carried millions of swaps in September 2026, while the first pool limited to approved wallets through Uniswap's shared
  hook recorded its first trades.
objectIds: [uniswap-v4, usdc]
contextualSubjectIds: [product:uniswap-permissioned-pools, org:uniswap-labs, org:securitize]
collections: [d0-in-use]
outcome:
  mechanism: reusable-infrastructure
  state: reproduced-observation
  statement: >-
    In September 2026 the Uniswap v4 PoolManager on Ethereum recorded 2,743,172 swap events in pools without a hook and
    988,307 in pools with one. The only pool on Uniswap's shared permissioned hook, created on 25 September, recorded 2.
ethereumContribution: >-
  Ethereum runs one PoolManager for every v4 pool, so an open market and a permissioned one settle through the same
  code, with the same routers and position tools. The issuer's rules travel with the pool's hook rather than with a
  website in front of it.
controlBoundary: >-
  The PoolManager cannot be upgraded, but each pool's hook and tokens set its own conditions. In a permissioned pool
  the issuer controls the allowlist, can pause swapping and can unwind positions, while Uniswap deploys the shared hook
  that enforces them.
claimIds:
  - uniswap-permissioned-pools-before
  - uniswap-permissioned-pools-announced
  - uniswap-v4-deployments
  - uniswap-v4-hooks-docs
  - uniswap-v4-launch-hooks-costs
  - uniswap-permissioned-pools-adapter
  - onchain-uniswap-v4-swaps-2026-09
  - onchain-uniswap-cores-2026-10-01
  - uniswap-permissioned-pools-live
  - uniswap-permissioned-pools-addresses
  - onchain-permissioned-pool-2026-10-01
  - uniswap-permissioned-pools-architecture
  - uniswap-permissioned-pools-issuer-recall
  - circle-usdc-blocklisting
observationIds:
  - uniswap-v4-swaps-2026-09
  - uniswap-v4-unhooked-swaps-2026-09
  - uniswap-v4-hooked-swaps-2026-09
  - uniswap-v4-hooks-used-2026-09
  - uniswap-v4-pools-2026-10-01
  - uniswap-v4-hooked-pools-2026-10-01
  - permissioned-pools-2026-10-01
  - permissioned-pools-swaps-2026-09
relationshipIds: []
reviewedAt: 2026-10-02
---

## Before

An automated exchange pool trades with whoever calls it. That openness kept tokens that only approved investors may
hold, such as tokenized funds and securities, out of pools altogether. Uniswap Labs described Permissioned Pools as
giving approved investors direct onchain trading for assets that previously could not trade on an AMM at all, with the
pool itself checking each wallet rather than a website turning wallets away {{claim:uniswap-permissioned-pools-before}}.

## The mechanism

{{object:uniswap-v4}} keeps every pool in one contract, the PoolManager {{claim:uniswap-v4-deployments}}. What differs
from pool to pool is the hook: an optional contract that a pool names when it is created and can never add, remove or
swap afterwards, and that can run its own logic around swaps, fees and liquidity {{claim:uniswap-v4-hooks-docs}}
{{claim:uniswap-v4-launch-hooks-costs}}.

Permissioned Pools use that slot. A shared hook, deployed by Uniswap, checks the issuer's allowlist before every swap and
every new position {{claim:uniswap-permissioned-pools-announced}}. Because the shared PoolManager cannot be added to
every issuer's allowlist, the pool trades a stand-in: a Permissions Adapter that holds the real token, which only the
PoolManager may hold and which the router converts back into the real token on the way out
{{claim:uniswap-permissioned-pools-adapter}}. Anyone can still create ordinary pools in the same contract without asking
{{claim:uniswap-permissioned-pools-before}}.

## Evidence of use

Most v4 trading runs in pools that anyone can use. In September 2026 the PoolManager recorded
{{obs:uniswap-v4-swaps-2026-09}}: {{obs:uniswap-v4-unhooked-swaps-2026-09}} in pools without a hook and
{{obs:uniswap-v4-hooked-swaps-2026-09}} in pools with one, which used {{obs:uniswap-v4-hooks-used-2026-09}}
{{claim:onchain-uniswap-v4-swaps-2026-09}}. Of the {{obs:uniswap-v4-pools-2026-10-01}} created by 1 October,
{{obs:uniswap-v4-hooked-pools-2026-10-01}} named a hook {{claim:onchain-uniswap-cores-2026-10-01}}. Most hooks change
pricing or fees rather than access, and a swap event is one step through one pool, not a trade or a trader.

Controlled markets have barely started. Uniswap Labs said the standard was live on Ethereum in August 2026
{{claim:uniswap-permissioned-pools-live}}, and by 1 October Uniswap's shared PermissionedHooks contract
{{claim:uniswap-permissioned-pools-addresses}} served {{obs:permissioned-pools-2026-10-01}}. Created on 25 September, it
trades USDC against Uniswap v4 THING, the adapter for a token named THING, at a 0.3% fee, and recorded
{{obs:permissioned-pools-swaps-2026-09}} {{claim:onchain-permissioned-pool-2026-10-01}}. No Uniswap or issuer source
names that token's issuer, so the pool shows the mechanism working on Ethereum, not an issuer's market in use. Pools
that use an issuer's own copy of the hook are not counted.

## What becomes possible

An issuer can bring a restricted token to the same pools, routers and liquidity tools that open markets use, while
keeping its own rules. Approved wallets swap and provide liquidity, and the router turns the stand-in back into the real
token, so holders never handle the adapter {{claim:uniswap-permissioned-pools-adapter}}. The launch partners named in
July 2026, Superstate, Securitize and Dowgo, work on tokenized funds and securities
{{claim:uniswap-permissioned-pools-announced}}. By 1 October 2026 none of their assets traded in a pool on the shared
hook on Ethereum {{claim:onchain-permissioned-pool-2026-10-01}}.

## What remains controlled

The PoolManager is {{grade:uniswap-v4}} in EDI, an assessment of the core contract on Ethereum. A position in a v4 pool
also depends on its hook and its tokens, which EDI has not resolved, so it is shown as {{grade:uniswap-v4:position}}. In
a permissioned pool those dependencies are the point:

- The issuer, as the adapter's owner, decides who may swap or provide liquidity through a contract it can replace, and
  can pause swapping of its token {{claim:uniswap-permissioned-pools-architecture}}. Swapping stays off on a new adapter
  until the issuer turns it on {{claim:uniswap-permissioned-pools-issuer-recall}}.
- The issuer can unwind any position, sending each asset back to its holder, or to that asset's issuer when the holder
  can no longer receive it, and positions cannot be transferred {{claim:uniswap-permissioned-pools-issuer-recall}}.
- Uniswap deploys the shared hook and adapter factory, which issuers do not control
  {{claim:uniswap-permissioned-pools-architecture}}.
- {{object:usdc}}, on the other side of the live pool, is {{grade:usdc}}: Circle can block transfers to and from an
  address {{claim:circle-usdc-blocklisting}}.
- The live pool's adapter owner is an address the directory could not identify
  {{claim:onchain-permissioned-pool-2026-10-01}}.
