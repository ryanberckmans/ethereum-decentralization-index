---
ediId: morpho-blue
contentStatus: edited-profile
role: lending
summary: A lending core with no upgrade path. Anyone can open a market for one loan token against one collateral token, and its oracle and terms stay fixed for good.
capability: >-
  Morpho Blue lets anyone create an isolated lending market by choosing five things: the collateral token, the loan
  token, the liquidation threshold, the price oracle and the interest rate model. Lenders supply the loan token and
  borrowers post collateral to borrow it, on terms no one can change once the market exists. Products such as
  Coinbase's crypto-backed loans are built on top.
authority: >-
  The core contract cannot be upgraded or paused. Morpho governance can approve new options for future markets and
  switch on a capped fee, but cannot change an existing market. Each market's oracle is chosen by its creator, not by
  Morpho, and vaults and products built on these markets keep their own controls.
economicTags: [lending, borrowing, collateral, isolated markets, crypto-backed loans]
aliases: [Morpho Blue, Morpho, Morpho Blue markets]
officialLinks:
  - label: How Morpho markets work (Morpho docs)
    url: https://docs.morpho.org/learn/concepts/blue
    checkedAt: 2026-10-02
  - label: Morpho Blue contract reference
    url: https://docs.morpho.org/developers/contracts/blue
    checkedAt: 2026-10-02
  - label: Morpho contract addresses
    url: https://docs.morpho.org/developers/contracts/addresses
    checkedAt: 2026-10-02
featuredObservationId: morpho-blue-usdc-borrowed-2026-09
editorialReviewedAt: 2026-10-02
---

## What it enables

Morpho Blue went live on Ethereum in January 2024 {{claim:morpho-blue-live-2024}}. Anyone can create a lending market
on it without a governance vote. A market is defined by five parameters: the collateral token, the loan token, the
liquidation loan-to-value ratio (LLTV), the oracle and the interest rate model. They are fixed when the market is
created, and the LLTV and rate model must be options that governance has approved
{{claim:morpho-docs-permissionless-markets}}. Each market is isolated from the others.

Rates follow demand. Under the usual rate model, AdaptiveCurveIRM, the rate keeps rising while a market's utilization
stays above its 90% target, and at full utilization it doubles every five days {{claim:morpho-docs-adaptive-curve-irm}}.
A market that lenders cannot leave becomes steadily more expensive to borrow from.

The choices that carry risk belong to each market. Its oracle is chosen by the market's creators, not by Morpho, and
cannot be changed later {{claim:morpho-docs-oracle-per-market}}. Lenders bear those choices: if the market runs out of
liquidity they may be unable to withdraw for a while, and if collateral falls below a debt before it is liquidated,
the borrower has no reason to repay {{claim:morpho-docs-lender-risks}}.

## Observed use

In September 2026, borrowers on Ethereum drew {{obs:morpho-blue-usdc-borrowed-2026-09}} from Morpho Blue's USDC
markets in {{obs:morpho-blue-usdc-borrow-events-2026-09}} {{claim:onchain-morpho-blue-ethereum-2026-10-01}}, and
{{obs:morpho-blue-weth-borrowed-2026-09}} from its WETH markets {{claim:onchain-morpho-blue-weth-2026-09}}. These are
gross amounts lent: repayments are not subtracted and a refinanced loan counts again, so they are not loans
outstanding.

By 1 October 2026, {{obs:morpho-blue-markets-2026-10-01}} had been created on Ethereum. Of those,
{{obs:morpho-blue-usdc-markets-2026-10-01}} lent USDC, and {{obs:morpho-blue-usdc-markets-with-borrows-2026-10-01}}
had ever recorded a borrow. The cbBTC/USDC market at an 86% LLTV, for example, had
{{obs:morpho-eth-cbbtc-usdc-borrowed-2026-10-01}} lent out of {{obs:morpho-eth-cbbtc-usdc-supplied-2026-10-01}}
supplied {{claim:onchain-morpho-ethereum-markets-2026-10-01}}.

Market totals cannot simply be added up. Two USDC markets recorded borrows equal to their entire supply:
{{obs:morpho-eth-paxg-usdc-borrowed-2026-10-01}} in a market taking PAXG as collateral and
{{obs:morpho-eth-sdeusd-usdc-borrowed-2026-10-01}} in one taking sdeUSD. Yet the whole contract held only
{{obs:morpho-blue-paxg-held-2026-10-01}} and {{obs:morpho-blue-sdeusd-held-2026-10-01}} across all its markets. Those
recorded totals are not evidence of lending on that scale, and the directory has not established what they represent.

For an earlier view, Morpho reported in August 2024 that deposits had passed {{obs:morpho-blue-deposits-2024-08-01}}
in the six months since launch {{claim:morpho-deposits-2024}}. That is Morpho's own figure, and deposits are not loans.

The same contract code also runs on Base, at the same address {{claim:morpho-docs-addresses}}, where Coinbase offers its
customers USDC loans against bitcoin {{claim:coinbase-bitcoin-loans-launch}}. That deployment,
{{subject:deployment:morpho-blue-base}}, is a separate market system on another network, and its figures are never
added to Ethereum's.

## Control in context

The lending core is {{grade:morpho-blue}} in EDI. The assessment covers the Morpho Blue contract on Ethereum at
0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb, whose code cannot be upgraded or paused. A position in a market also
depends on that market's oracle and tokens, which EDI reviews for each position and has not resolved, so a position is
shown as {{grade:morpho-blue:position}}.

Governance is deliberately narrow. It can turn on a fee of at most 25% of the interest borrowers pay, set the fee
recipient, and approve new LLTVs and rate models for future markets {{claim:morpho-docs-governance}}. It can enable those
options but never disable them {{claim:morpho-docs-owner-powers}}. Governance is morpho.eth, a 5-of-9 multisig that
carries out what MORPHO holders approve in votes {{claim:morpho-docs-governance-multisig}}. On 1 October 2026 it owned
the contract, and the fee recipient was unset {{claim:onchain-morpho-governance-2026-10-01}}.
