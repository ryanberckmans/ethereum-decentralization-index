---
ediId: pyusd
contentStatus: edited-profile
role: dollar-token
summary: PayPal's dollar stablecoin, issued by Paxos and launched on Ethereum in 2023. Customers can move it from PayPal to their own wallets, while Paxos holds the reserves and can freeze or wipe balances.
capability: >-
  PYUSD is a dollar token that PayPal customers can buy, send and spend inside PayPal and withdraw to any compatible
  wallet, where it works like any other ERC-20 token. Paxos redeems it one for one for US dollars and backs it with dollar
  deposits, short-term Treasuries and cash equivalents. It moves between networks by burning on one and minting on
  another.
authority: >-
  Paxos Trust Company issues and redeems PYUSD, holds its reserves, and can freeze any address and wipe a frozen
  balance. PayPal decides how its own customers can use the token, and tokens that third-party bridges issue elsewhere
  are not Paxos's.
economicTags: [stablecoin, US dollars, payments, PayPal]
aliases: [PayPal USD, PayPal stablecoin]
officialLinks:
  - label: PayPal USD (PayPal)
    url: https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd
    checkedAt: 2026-10-02
  - label: PYUSD token addresses (Paxos)
    url: https://docs.paxos.com/guides/stablecoin/pyusd/mainnet
    checkedAt: 2026-10-02
  - label: PYUSD transparency reports (Paxos)
    url: https://www.paxos.com/pyusd-transparency
    checkedAt: 2026-10-02
featuredObservationId: pyusd-supply-ethereum-2026-10-01
editorialReviewedAt: 2026-10-02
---

## What it enables

PayPal launched PYUSD on 7 August 2023 as an ERC-20 token on Ethereum, issued by Paxos Trust Company. It is backed by
US dollar deposits, short-term US Treasuries and similar cash equivalents, and redeemable one for one for dollars
{{claim:pyusd-launch-2023}}. From launch, eligible US PayPal customers could move it between PayPal and compatible
external wallets, send it to other people, pay with it at checkout and convert cryptocurrencies to and from it
{{claim:pyusd-paypal-uses-2023}}. A balance held with PayPal can become a token in the holder's own wallet, and come
back again.

PYUSD has since spread to other networks: Solana in May 2024 {{claim:pyusd-solana-2024}} and Arbitrum in July 2025
{{claim:pyusd-arbitrum-2025}}. It moves between Ethereum and Solana through LayerZero, by burning tokens on one chain and
minting them on the other {{claim:pyusd-layerzero-2025}}.

## Observed use

Ethereum holds the most natively minted PYUSD. Paxos's report for 31 August 2026, examined by KPMG, counts
{{obs:pyusd-reported-ethereum-2026-08-31}} on Ethereum, more than on Solana or Arbitrum One
{{claim:pyusd-report-2026-08}}.

On chain, the supply on Ethereum fell from {{obs:pyusd-supply-ethereum-2026-09-01}} on 1 September 2026 to
{{obs:pyusd-supply-ethereum-2026-10-01}} on 1 October {{claim:onchain-pyusd-2026-09}}. In between, the contract minted
{{obs:pyusd-minted-2026-09}} and burned {{obs:pyusd-burned-2026-09}}, figures that include moves to and from other
networks. Holders made {{obs:pyusd-transfers-2026-09}} moving {{obs:pyusd-transfer-volume-2026-09}}, a gross figure in
which the same tokens can move many times.

## Control in context

PYUSD is {{grade:pyusd}} in EDI, whose review finds that Paxos's custody and asset-protection controls remain part of
the asset. Paxos's token contracts let an asset protection role freeze any address and wipe a frozen balance, let a
pause role stop all transfers, and leave minting and burning to supply controllers {{claim:paxos-token-roles}}. Paxos's
stablecoin terms give it the right to freeze and upgrade all its dollar tokens wherever they are held, and say that a
token a third-party bridge issues against locked PYUSD is not Paxos's to issue or redeem
{{claim:paxos-bridged-stablecoins}}.

These powers are in use. By 1 October 2026, {{obs:pyusd-frozen-addresses-2026-10-01}} were frozen in PYUSD, and Paxos
had wiped frozen balances {{obs:pyusd-wiped-balances-2026-10-01}} {{claim:onchain-issuer-freezes-2026-10-01}}.

EDI's record for PYUSD names no contract address. The figures here read 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8, the
address Paxos lists for Ethereum {{claim:pyusd-addresses}}. PYUSD on other networks is a separate deployment.
