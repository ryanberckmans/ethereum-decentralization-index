---
ediId: buidl
contentStatus: edited-profile
role: fund-shares
summary: Tokenized shares of BlackRock's US dollar liquidity fund. Approved investors hold and move them on chain, while BlackRock and Securitize control who may hold them.
capability: >-
  BUIDL puts shares of the BlackRock USD Institutional Digital Liquidity Fund on chain as tokens. Pre-approved
  investors can transfer them to each other at any hour and receive dividends as new tokens each month, and some
  exchanges and trading systems accept or trade them. The fund itself invests in cash, US Treasury bills and repurchase
  agreements.
authority: >-
  BlackRock manages the fund, and Securitize, its transfer agent, manages the tokens through every subscription,
  redemption and distribution. Only investors they approve can hold or receive BUIDL, so ownership and redemption
  depend on both companies.
economicTags: [tokenized fund, US Treasuries, cash management, institutional investors, collateral]
aliases: [BlackRock BUIDL, BlackRock USD Institutional Digital Liquidity Fund, BUIDL fund]
officialLinks:
  - label: BlackRock's official token addresses
    url: https://www.blackrock.com/corporate/compliance/scams-and-fraud/blackrock-token-addresses
    checkedAt: 2026-10-02
  - label: BUIDL on Securitize
    url: https://securitize.io/blackrock/buidl
    checkedAt: 2026-10-02
  - label: BUIDL share classes on more networks (BlackRock and Securitize)
    url: https://www.prnewswire.com/news-releases/blackrock-launches-new-buidl-share-classes-across-multiple-blockchains-to-expand-access-and-potential-of-buidl-ecosystem-302304035.html
    checkedAt: 2026-10-02
featuredObservationId: buidl-supply-2026-10-01
editorialReviewedAt: 2026-10-02
---

## What it enables

BlackRock announced BUIDL on 20 March 2024 as its first tokenized fund issued on a public blockchain. Qualified
investors subscribe through Securitize Markets and earn US dollar yields {{claim:buidl-launch-2024}}. At launch the fund
sought a stable value of 1 dollar per token and invested all its assets in cash, US Treasury bills and repurchase
agreements. Dividends accrue daily and are paid monthly as new tokens, and holders can transfer tokens at any hour, but
only to other pre-approved investors {{claim:buidl-design-2024}}.

As tokens, fund shares can be used in places a fund statement cannot, within limits the issuer sets. Crypto.com and
Deribit said in June 2025 that they would accept BUIDL as collateral {{claim:buidl-collateral-exchanges-2025}}, and
Binance followed in November 2025 for collateral held off the exchange {{claim:buidl-collateral-binance-2025}}. Uniswap
Labs and Securitize said in February 2026 that whitelisted investors could trade BUIDL with whitelisted market makers
through UniswapX, Uniswap's quote-based trading system, each trade settling on chain {{claim:buidl-uniswapx-2026}}. None
of these announcements names the network or share class involved, and UniswapX is not a Uniswap v4 pool.

BUIDL began on Ethereum. BlackRock added share classes on Aptos, Arbitrum, Avalanche, OP Mainnet and Polygon in
November 2024 {{claim:buidl-share-classes-2024}}, and Securitize added Solana in March 2025
{{claim:buidl-solana-2025}}. Each network's class is a separate token contract.

## Observed use

On 1 October 2026 the BUIDL contract on Ethereum had {{obs:buidl-supply-2026-10-01}} outstanding, down from
{{obs:buidl-supply-2026-09-01}} a month earlier {{claim:onchain-buidl-2026-09}}. During September it issued
{{obs:buidl-minted-2026-09}}, for subscriptions and dividends alike, and burned {{obs:buidl-burned-2026-09}}. Holders
moved {{obs:buidl-holder-transfer-volume-2026-09}} among themselves in {{obs:buidl-holder-transfers-2026-09}}.

BlackRock lists a second Ethereum address for BUIDL {{claim:buidl-token-addresses}}, which reports the symbol BUIDL-I:
{{subject:deployment:buidl-i-ethereum}}. Its supply fell from {{obs:buidl-i-supply-2026-09-01}} to
{{obs:buidl-i-supply-2026-10-01}} during September, with {{obs:buidl-i-burned-2026-09}} burned
{{claim:onchain-buidl-i-2026-09}}. The chain does not show whether those burns were redemptions or moves into another
share class. The two contracts are separate classes, and their figures are not added together.

## Control in context

BUIDL is {{grade:buidl}} in EDI, whose review finds that fund ownership and redemption depend on BlackRock, Securitize
and the rules on who may hold the tokens. BlackRock Financial Management manages the fund's investments, Bank of New
York Mellon holds its assets, and Securitize, as transfer agent and tokenization platform, manages the tokenized
shares {{claim:buidl-service-providers}}. The launch release also warned that the fund may not always keep its value at
1 dollar per token {{claim:buidl-design-2024}}.

EDI's record for BUIDL names no contract address. The figures above read 0x7712c34205737192402172409a8f7ccef8aa2aec,
one of the two Ethereum addresses BlackRock lists and the one that reports the symbol BUIDL
{{claim:buidl-token-addresses}}. Other networks' share classes, and any exchange or system that holds BUIDL as
collateral, add their own controls.
