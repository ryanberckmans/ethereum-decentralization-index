---
id: morpho-and-distribution
title: Morpho and distribution
dek: >-
  Coinbase customers borrow USDC against their bitcoin inside the Coinbase app. The loans run on Morpho's lending
  contract on Base, the same code that runs Morpho's own markets on Ethereum.
thesis: >-
  A lending core that anyone can build on can reach people through another company's app: Coinbase's crypto-backed
  loans run on Morpho's contract on Base, and the market behind them recorded more borrows in September 2026 than all of
  Morpho's USDC markets on Ethereum.
objectIds: [morpho-blue, base, cbbtc]
contextualSubjectIds:
  - org:coinbase
  - product:coinbase-crypto-backed-loans
  - deployment:morpho-blue-base
  - deployment:cbbtc-base
  - deployment:usdc-base
collections: [global-economy]
outcome:
  mechanism: distribution
  state: reported-adoption
  statement: >-
    Morpho reported on 22 September 2026 that Coinbase's variable-rate loans on Base had grown past 1.4 billion dollars
    in active loans, backed by about 3 billion dollars of collateral.
ethereumContribution: >-
  Morpho Blue launched on Ethereum, where its lending code cannot be upgraded and still runs Morpho's original markets.
  The same code at the same address serves Coinbase's loans on Base, a network that posts its data and state to
  Ethereum.
controlBoundary: >-
  The lending rules are fixed, but every market relies on the oracle and assets chosen when it was created. Coinbase
  decides who can borrow in its app and issues cbBTC, the first collateral. The Base deployment has no EDI assessment of
  its own, and Coinbase and a Security Council control Base's upgrades.
claimIds:
  - morpho-blue-live-2024
  - morpho-docs-permissionless-markets
  - morpho-deposits-2024
  - morpho-coinbase-abstraction
  - coinbase-bitcoin-loans-launch
  - morpho-docs-addresses
  - onchain-morpho-governance-2026-10-01
  - morpho-coinbase-cbbtc-market
  - morpho-coinbase-collateral-markets
  - morpho-coinbase-active-loans-2026-09
  - onchain-morpho-base-coinbase-market-2026-10-01
  - onchain-morpho-blue-ethereum-2026-10-01
  - steakhouse-coinbase-usdc-lending
  - morpho-coinbase-fixed-rate-midnight
  - morpho-docs-oracle-per-market
  - morpho-docs-governance
  - morpho-docs-governance-multisig
  - base-security-council-docs
observationIds:
  - morpho-blue-deposits-2024-08-01
  - coinbase-active-loans-2026-09-22
  - coinbase-loan-collateral-2026-09-22
  - morpho-base-cbbtc-usdc-borrowed-2026-10-01
  - morpho-base-cbbtc-usdc-borrowed-2026-09
  - morpho-base-cbbtc-usdc-borrow-events-2026-09
  - morpho-blue-markets-2026-10-01
  - morpho-blue-usdc-markets-2026-10-01
  - morpho-blue-usdc-borrow-events-2026-09
  - morpho-blue-usdc-borrowed-2026-09
relationshipIds:
  - coinbase-loans-morpho-base
  - cbbtc-base-morpho-base
  - morpho-blue-base-base
  - base-ethereum
reviewedAt: 2026-10-02
---

## Before

{{object:morpho-blue}} went live on Ethereum on 10 January 2024 {{claim:morpho-blue-live-2024}}. Anyone can create a
lending market in it without a vote by fixing five parameters: the collateral, the asset lent, the liquidation
loan-to-value ratio (LLTV), the oracle and the interest rate model {{claim:morpho-docs-permissionless-markets}}. Morpho
said deposits passed {{obs:morpho-blue-deposits-2024-08-01}} within six months {{claim:morpho-deposits-2024}}.

To use those markets, though, a borrower had to come to the contract. That meant running a wallet, paying gas and
wrapping bitcoin into a token before it could serve as collateral, the steps that Morpho says Coinbase now takes off
its customers' hands {{claim:morpho-coinbase-abstraction}}.

## The mechanism

Coinbase put a product on top of the contract. Since January 2025 its customers have been able to borrow USDC against
bitcoin, in loans built on Base and powered by Morpho, starting with US customers outside New York
{{claim:coinbase-bitcoin-loans-launch}}. The customer borrows in the Coinbase app. Coinbase handles the chain, the
wallet, gas fees and wrapping, and the loan's terms, collateral and balance sit in a Morpho market where anyone can read
them {{claim:morpho-coinbase-abstraction}}.

The market runs on Morpho Blue's code at the same address on Base as on Ethereum {{claim:morpho-docs-addresses}}:
{{subject:deployment:morpho-blue-base}}, which has had code there since May 2024
{{claim:onchain-morpho-governance-2026-10-01}}. The loans began in its cbBTC/USDC market, which lends USDC against
Coinbase's wrapped bitcoin at an 86% LLTV {{claim:morpho-coinbase-cbbtc-market}}, and have since added markets that take
ETH, XRP, SOL, ADA, DOGE and LTC as collateral {{claim:morpho-coinbase-collateral-markets}}.

## Evidence of use

Morpho reported on 22 September 2026 that Coinbase's variable-rate loans had passed
{{obs:coinbase-active-loans-2026-09-22}} in active loans, backed by {{obs:coinbase-loan-collateral-2026-09-22}} of
collateral {{claim:morpho-coinbase-active-loans-2026-09}}. These are Morpho's own figures for Base, given without a
method.

The chain shows the first market at work. On 1 October 2026 the cbBTC/USDC market on Base recorded
{{obs:morpho-base-cbbtc-usdc-borrowed-2026-10-01}} outstanding. During September it paid
{{obs:morpho-base-cbbtc-usdc-borrowed-2026-09}} to borrowers in {{obs:morpho-base-cbbtc-usdc-borrow-events-2026-09}}
{{claim:onchain-morpho-base-coinbase-market-2026-10-01}}. Morpho's figure and the market's overlap without matching:
one covers Coinbase's loans in every collateral market, the other any borrower in this one.

The original contract on Ethereum serves a different crowd. By 1 October 2026, {{obs:morpho-blue-markets-2026-10-01}}
had been created in it, {{obs:morpho-blue-usdc-markets-2026-10-01}} of them lending USDC. In September those USDC
markets recorded {{obs:morpho-blue-usdc-borrow-events-2026-09}} that paid out {{obs:morpho-blue-usdc-borrowed-2026-09}}
{{claim:onchain-morpho-blue-ethereum-2026-10-01}}: fewer borrows than the single Base market, for more dollars. A borrow
event is one draw on a loan, not one borrower, and the two networks' figures are never added together.

## What becomes possible

Once lending is a shared contract, a company can add products without becoming a lender itself. Coinbase's USDC
lending, launched in September 2025, puts customers' USDC into Morpho vaults on Base curated by Steakhouse Financial
{{claim:steakhouse-coinbase-usdc-lending}}, so its customers can lend as well as borrow. In September 2026 Coinbase added
fixed-rate loans through Morpho Midnight, a separate fixed-rate protocol on Base
{{claim:morpho-coinbase-fixed-rate-midnight}}.

## What remains controlled

Morpho Blue on Ethereum is {{grade:morpho-blue}} in EDI, whose review finds that the core cannot be upgraded or paused.
A position in one of its markets also depends on that market's oracle and collateral, which EDI has not resolved, so a
position is shown as {{grade:morpho-blue:position}}. Around Coinbase's loans, more authority sits outside the core:

- {{subject:deployment:morpho-blue-base}} is a separate deployment on a separate network. EDI's assessment covers only
  the Ethereum contract.
- Base is {{grade:base}} in EDI: its upgrades need both a Coinbase multisig and a Security Council
  {{claim:base-security-council-docs}}.
- cbBTC is Coinbase's token, backed by bitcoin that Coinbase holds. EDI assesses the Ethereum contract as
  {{grade:cbbtc}}; {{subject:deployment:cbbtc-base}} is a separate contract.
- Coinbase decides who can borrow through its app and runs the wallet steps for its customers
  {{claim:coinbase-bitcoin-loans-launch}} {{claim:morpho-coinbase-abstraction}}.
- Each market's oracle is chosen by the people who set the market up, not by Morpho, and cannot be changed afterwards
  {{claim:morpho-docs-oracle-per-market}}. Morpho governance, a multisig that carries out MORPHO holders' votes
  {{claim:morpho-docs-governance-multisig}}, can turn on a fee of up to 25% of the interest borrowers pay
  {{claim:morpho-docs-governance}}.
