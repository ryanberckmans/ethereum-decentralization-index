---
# Example only: shows the shape of a story. Verify every fact before publishing.
id: example-story
title: Exchange, made reusable
dek: A fixed exchange mechanism became infrastructure that other programs build on.
thesis: Uniswap v2's immutable core let developers compose trading into their own transactions at scale.
objectIds: [uniswap-v2]
contextualSubjectIds: [org:uniswap-labs]
collections: [d0-in-use]
outcome:
  mechanism: reusable-infrastructure
  state: reported-adoption
  statement: Developers routed substantial flash-swap volume through the v2 core within its first year.
ethereumContribution: >-
  Ethereum lets any program call the same pools in one atomic transaction, with settlement rules nobody can rewrite.
controlBoundary: >-
  The assessment covers the reviewed core. Tokens in each pool keep their own issuers and controls.
claimIds: [uniswap-2020-review]
observationIds: [v2-flash-swaps-2020]
relationshipIds: []
reviewedAt: 2026-10-02
---

## Before

Exchanging tokens required an operator to run an order book or hold customer balances.

## The mechanism

{{object:uniswap-v2}} pools quote prices from their own balances. Flash swaps let a program use pool
assets first and settle before the transaction ends.

## Evidence of use

Uniswap Labs reported {{obs:v2-flash-swaps-2020}} {{claim:uniswap-2020-review}}.

## What becomes possible

Arbitrage, refinancing and liquidations can be written as one transaction against a shared market.

## What remains controlled

The reviewed core is {{grade:uniswap-v2}}. Each traded token keeps its own issuer and controls.
