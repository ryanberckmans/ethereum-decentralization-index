---
ediId: paxg
contentStatus: edited-profile
role: commodity-claim
summary: A token for one fine troy ounce of vaulted gold, issued by Paxos on Ethereum since 2019. It moves like any token, while Paxos holds the gold and can freeze or wipe balances.
capability: >-
  PAXG lets anyone hold and send a claim on physical gold as an ERC-20 token, in amounts far smaller than a bar, and use
  it wherever tokens work. Each token represents one fine troy ounce of a London Good Delivery bar held in professional
  vaults, and verified Paxos customers can redeem tokens for bars, unallocated gold or dollars.
authority: >-
  Paxos Trust Company holds the gold, mints and burns tokens, and can freeze any address and wipe a frozen balance. The
  gold and its redemption are off chain, so holders depend on Paxos and its vaults.
economicTags: [gold, commodities, tokenized gold, collateral]
aliases: [Pax Gold, PAX Gold, Paxos Gold]
officialLinks:
  - label: Pax Gold (Paxos)
    url: https://www.paxos.com/pax-gold
    checkedAt: 2026-10-02
  - label: PAXG token addresses (Paxos)
    url: https://docs.paxos.com/guides/stablecoin/paxg/mainnet
    checkedAt: 2026-10-02
  - label: PAXG transparency reports (Paxos)
    url: https://www.paxos.com/paxg-transparency
    checkedAt: 2026-10-02
featuredObservationId: paxg-supply-ethereum-2026-10-01
editorialReviewedAt: 2026-10-02
---

## What it enables

Paxos defines PAXG as a token in which one token represents one fine troy ounce of a London Good Delivery gold bar
stored in professional vaults. Holders own that gold, which Paxos Trust Company holds in custody
{{claim:paxg-definition}}. As a token, the claim on gold can be split into small amounts, sent to anyone and held by
any contract that handles ERC-20 tokens. Verified Paxos customers can redeem PAXG for gold bars, which takes 430 PAXG,
for unallocated gold held in London, or for US dollars at the market price {{claim:paxg-redemption}}.

PAXG launched on Ethereum in 2019. Paxos called its June 2026 launch on Solana the first step in PAXG's expansion to
other networks, and Ethereum holders can bridge through the Paxos platform or LayerZero {{claim:paxg-solana-2026}}.

## Observed use

Paxos's report on PAXG for 31 August 2026, examined by KPMG, counts {{obs:paxg-reported-ethereum-2026-08-31}} natively
minted on Ethereum, nearly all of the PAXG in existence. It says the gold is stored with Brink's Global Services and
ICBC Standard Bank, both LBMA-approved vaults {{claim:paxg-report-2026-08}}.

The contract's own supply matches. It stood at {{obs:paxg-supply-ethereum-2026-09-01}} at the start of September 2026,
the same as at the report's cut-off, and reached {{obs:paxg-supply-ethereum-2026-10-01}} on 1 October
{{claim:onchain-paxg-2026-09}}. In between Paxos minted {{obs:paxg-minted-2026-09}} and burned
{{obs:paxg-burned-2026-09}}, and holders made {{obs:paxg-transfers-2026-09}} besides mints and burns.

PAXG also serves as collateral. The Morpho Blue lending contract held {{obs:morpho-blue-paxg-held-2026-10-01}} on 1
October across all its markets {{claim:onchain-morpho-ethereum-markets-2026-10-01}}.

## Control in context

PAXG is {{grade:paxg}} in EDI, whose review finds that Paxos's custody and asset-protection controls remain part of the
asset: the backing is off chain, and the issuer can freeze and wipe balances. Paxos's token contracts give an asset
protection role the power to freeze any address and wipe a frozen balance so that authorities can seize the backing
gold, let a pause role stop all transfers, and leave minting and burning to supply controllers
{{claim:paxos-token-roles}}. Paxos's terms allow a freeze when the law requires it, on formal notice from a partner, or
at Paxos's sole discretion {{claim:paxg-terms-freeze}}.

These powers are in use. By 1 October 2026, {{obs:paxg-frozen-addresses-2026-10-01}} were frozen in PAXG, every
address it had ever frozen, and Paxos had wiped frozen balances {{obs:paxg-wiped-balances-2026-10-01}}
{{claim:onchain-issuer-freezes-2026-10-01}}.

EDI's record for PAXG names no contract address. The figures here read 0x45804880De22913dAFE09f4980848ECE6EcbAf78, the
address Paxos lists for Ethereum {{claim:paxg-addresses}}. PAXG on other networks is a separate token.
