---
# Example only: shows the shape of an edited profile. Verify every fact before publishing.
ediId: uniswap-v2
contentStatus: edited-profile
role: exchange
summary: An immutable exchange core that any program can trade against or borrow from within one transaction.
capability: >-
  Uniswap v2 turned a pool of two tokens into a reusable market that other programs can call.
  Flash swaps let a program use pool assets and settle within the same transaction.
authority: >-
  No administrator can change the reviewed pool rules. Each token in a pool keeps its own issuer
  and controls, and those are assessed separately.
economicTags: [token exchange, flash swaps, liquidity provision, price discovery]
aliases: [uniswap 2, univ2]
officialLinks:
  - label: Uniswap v2 documentation
    url: https://docs.uniswap.org/contracts/v2/overview
    checkedAt: 2026-10-02
featuredObservationId: v2-flash-swaps-2020
editorialReviewedAt: 2026-10-02
---

## What it enables

A Uniswap v2 pool holds two tokens and quotes a price from their balances. Any contract can trade
with it, add liquidity or take a flash swap {{claim:uniswap-2020-review}}. The reviewed core is
{{grade:uniswap-v2}}; the tokens traded through it are separate objects with their own grades.

## Observed use

Developers used flash swaps at scale within months of launch: {{obs:v2-flash-swaps-2020}}.
