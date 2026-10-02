---
id: dollars-on-ethereum
title: Dollars on Ethereum
dek: >-
  Circle's USDC turns dollars into a token that any Ethereum program can hold and settle, while Circle keeps the power
  to issue, redeem and block it.
thesis: >-
  Issuer-controlled dollars can run on open settlement infrastructure: a card network takes settlement in USDC over
  Ethereum, tens of billions are issued and redeemed there each month, and fixed exchange and lending cores hold it.
objectIds: [usdc, ethereum, morpho-blue, uniswap-v4]
contextualSubjectIds:
  - org:circle
  - org:visa
  - org:crypto-com
  - product:visa-stablecoin-settlement
  - ref:us-dollar
  - network:solana
  - deployment:usdc-base
collections: [global-economy]
outcome:
  mechanism: programmable-settlement
  state: reproduced-observation
  statement: >-
    In September 2026 Circle's minters created 16.4 billion USDC on Ethereum and destroyed 18.1 billion, while its
    cross-chain contracts brought in 6.4 billion and sent out 5.8 billion.
ethereumContribution: >-
  Ethereum gives the dollar token a public ledger and a standard interface. Any wallet, contract or institution can hold
  and settle USDC without an account with Circle, and fixed cores can treat it like any other asset.
controlBoundary: >-
  Circle issues and redeems USDC, holds its reserves, and can block addresses, pause transfers and upgrade the contract.
  Redemption through Circle Mint and settlement through Visa are services for approved participants.
claimIds:
  - visa-usdc-pilot-2021
  - visa-usdc-ethereum-settlement-2023
  - circle-usdc-terms
  - circle-usdc-redemption-access
  - circle-usdc-open-integration
  - circle-cctp-overview
  - circle-cctp-addresses
  - circle-gateway-addresses
  - visa-nine-chains-2026
  - visa-us-settlement-2025
  - onchain-usdc-2026-10-01
  - onchain-usdc-crosschain-2026-09
  - onchain-usdc-mint-burn-2026-09
  - onchain-usdc-in-cores-2026-10-01
  - visa-usdc-settlement-benefits
  - circle-fiattoken-design
  - circle-usdc-blocklisting
  - onchain-usdc-blocklist-2026-09
  - circle-transparency-2026-09
  - circle-usdc-addresses
observationIds:
  - visa-stablecoin-run-rate-2026-04
  - usdc-supply-ethereum-2026-10-01
  - usdc-supply-ethereum-2026-09-01
  - usdc-minted-by-circle-minters-ethereum-2026-09
  - usdc-burned-by-circle-minters-ethereum-2026-09
  - usdc-minted-crosschain-ethereum-2026-09
  - usdc-burned-crosschain-ethereum-2026-09
  - usdc-held-by-morpho-blue-2026-10-01
  - usdc-held-by-uniswap-v4-2026-10-01
  - usdc-blocklistings-ethereum-2026-09
  - usdc-circulation-2026-09-24
relationshipIds:
  - circle-issues-usdc
  - usdc-us-dollar
  - usdc-ethereum
  - visa-settlement-usdc
  - visa-settlement-ethereum
  - visa-settlement-solana
  - crypto-com-visa-settlement
reviewedAt: 2026-10-02
---

## Before

Visa's standard settlement process required its partners to settle in a traditional fiat currency
{{claim:visa-usdc-pilot-2021}}. For Crypto.com's card program in Australia, settling cross-border purchases meant a
days-long currency conversion and international wire transfers {{claim:visa-usdc-ethereum-settlement-2023}}. Dollars
moved between the two companies the way they move between most institutions: through banks, on business days
{{claim:visa-usdc-settlement-benefits}}.

## The mechanism

Circle issues {{object:usdc}} on Ethereum against US dollar-denominated reserves and redeems it for dollars
{{claim:circle-usdc-terms}}, directly for holders with a Circle Mint account {{claim:circle-usdc-redemption-access}}.
Between issuance and redemption, USDC is an ordinary Ethereum token. Anyone can hold it, send it or build it into an
application without approval from Circle or anyone else {{claim:circle-usdc-open-integration}}.

To move dollars between chains, Circle's Cross-Chain Transfer Protocol burns USDC on one chain and mints it on another,
without a bridge pool {{claim:circle-cctp-overview}}. Its contracts on Ethereum, and those of Circle's Gateway service,
are listed in Circle's documentation, so every unit they create or destroy can be told apart from the rest
{{claim:circle-cctp-addresses}} {{claim:circle-gateway-addresses}}.

## Evidence of use

In 2021 Visa settled a transaction in USDC over Ethereum, in a pilot with Crypto.com {{claim:visa-usdc-pilot-2021}}.
By 2023 Crypto.com was using USDC to meet its Visa card obligations in Australia, sending it over Ethereum directly to a
Circle account managed by Visa's treasury {{claim:visa-usdc-ethereum-settlement-2023}}. Visa's program now spans nine
chains, Ethereum among them, at an annualized run rate of {{obs:visa-stablecoin-run-rate-2026-04}} across all of them
{{claim:visa-nine-chains-2026}}. Visa publishes no figure for Ethereum alone, and the first US banks in the program
settle over Solana {{claim:visa-us-settlement-2025}}.

The chain shows the issuer's side directly. USDC's supply on Ethereum was {{obs:usdc-supply-ethereum-2026-10-01}}
{{claim:onchain-usdc-2026-10-01}}. Over September, Circle's minters created
{{obs:usdc-minted-by-circle-minters-ethereum-2026-09}} on Ethereum and destroyed
{{obs:usdc-burned-by-circle-minters-ethereum-2026-09}}, while its cross-chain contracts brought in
{{obs:usdc-minted-crosschain-ethereum-2026-09}} from other chains and sent out
{{obs:usdc-burned-crosschain-ethereum-2026-09}} {{claim:onchain-usdc-crosschain-2026-09}}. Supply had started the month
at {{obs:usdc-supply-ethereum-2026-09-01}}; burns exceeded mints by exactly the amount it fell
{{claim:onchain-usdc-mint-burn-2026-09}}. These flows show dollars entering and leaving Ethereum through Circle, not
payments between holders or new money.

Some of those dollars work inside fixed cores. The Morpho Blue lending contract held
{{obs:usdc-held-by-morpho-blue-2026-10-01}} not lent out, and the Uniswap v4 PoolManager held
{{obs:usdc-held-by-uniswap-v4-2026-10-01}} {{claim:onchain-usdc-in-cores-2026-10-01}}.

## What becomes possible

Settlement need not wait for banking days. Visa says USDC settlement lets card issuers settle seven days a week, without
any change for cardholders {{claim:visa-usdc-settlement-benefits}}, and a partner can pay directly into Visa's treasury
account at the issuer.

The same dollars are programmable liquidity. USDC can be lent through {{object:morpho-blue}} or traded through
{{object:uniswap-v4}}, cores whose rules no one can change: {{grade:morpho-blue}} and {{grade:uniswap-v4}} in EDI. A
balance can move to another chain and back through Circle's burn-and-mint contracts instead of a third-party bridge.

## What remains controlled

USDC is {{grade:usdc}}. Circle decides who can mint and redeem, holds the reserves off-chain, and can block any address,
pause all transfers or replace the contract's logic {{claim:circle-fiattoken-design}}
{{claim:circle-usdc-blocklisting}}. It uses the blocklist: {{obs:usdc-blocklistings-ethereum-2026-09}}
{{claim:onchain-usdc-blocklist-2026-09}}. A blocked address cannot send or receive USDC, including when the address is
an immutable exchange or lending core.

Visa's settlement is a program for its card partners, run through its own treasury; the 2021 pilot ran with Anchorage
as Visa's settlement partner {{claim:visa-usdc-pilot-2021}}. Circle's totals, such as
{{obs:usdc-circulation-2026-09-24}} in circulation, cover every chain it issues on and are not Ethereum figures
{{claim:circle-transparency-2026-09}}. USDC on other networks, such as {{subject:deployment:usdc-base}}, is a separate
contract outside this story {{claim:circle-usdc-addresses}}.
