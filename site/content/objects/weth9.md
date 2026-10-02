---
ediId: weth9
contentStatus: edited-profile
role: wrapper
summary: A fixed contract that turns ETH into an ERC-20 token one for one, so software written for tokens can hold and move ETH.
capability: >-
  WETH9 gives ETH the token interface that exchanges, lending markets and NFT marketplaces are built around. Anyone can
  deposit ETH and withdraw it again, under code that has not changed since December 2017. Because a token can be
  approved for a contract to spend later, WETH can fund standing offers and shared pools that native ETH cannot.
authority: >-
  None retained: WETH9 has no owner, administrator or upgrade path, so no one can change its rules, pause it or block a
  holder. Holders still choose which applications may spend their WETH, and those applications keep their own controls.
economicTags: [ETH as a token, NFT offers, token exchange, lending collateral]
aliases: [Wrapped Ether, Wrapped ETH, WETH9, wrapped ether]
officialLinks:
  - label: Verified source on Sourcify
    url: https://repo.sourcify.dev/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    checkedAt: 2026-10-02
  - label: Contract on Blockscout
    url: https://eth.blockscout.com/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    checkedAt: 2026-10-02
  - label: What is Wrapped Ether (ethereum.org)
    url: https://ethereum.org/wrapped-eth/
    checkedAt: 2026-10-02
featuredObservationId: weth9-eth-held-2026-10-01
editorialReviewedAt: 2026-10-02
---

## What it enables

ETH is older than the ERC-20 token standard, so it lacks the functions that most exchanges, lending markets and
marketplaces are written against {{claim:ethereum-org-why-weth}}. {{object:weth9}} supplies them in a few dozen lines of
code. Deposit ETH and the contract credits the same amount of WETH; withdraw WETH and it sends the ETH back. Its total
supply is simply the ETH it holds {{claim:sourcify-weth9-source}}. The code has been at the same address since block
4,719,568 on 12 December 2017 {{claim:onchain-weth9-2026-10-01}}, and Zellic formally verified that a depositor can
always withdraw their ETH whatever other users do {{claim:zellic-weth-verification}}.

The token form matters most when a contract has to move ETH later, on someone's behalf. A token holder can approve a
contract to spend up to a set amount, so a buyer can sign an offer that pays out only if a seller accepts it. OpenSea
requires offers on its marketplace to be made in WETH {{claim:opensea-weth-offers}}, and its developer kit describes the
approval a buyer gives for a token-priced purchase {{claim:opensea-sdk-conduit}}. Exchange pools and lending markets
hold WETH in the same way, as an ordinary token beside any other.

## Observed use

The contract held {{obs:weth9-eth-held-2026-10-01}}. That ETH is not new money: every unit belongs to whoever holds the
matching WETH and can be withdrawn by them.

Much of WETH's use is as payment for NFTs. On Seaport 1.6, the settlement contract behind new OpenSea orders
{{claim:opensea-seaport-1-6-orders}}, makers paid with WETH in {{obs:weth9-seaport16-offer-fills-2026-09}}, spending {{obs:weth9-seaport16-offer-volume-2026-09}}
{{claim:onchain-seaport16-2026-09}}. Nearly all of those fills, {{obs:opensea-weth-offer-fills-2026-09}}, were orders
that named OpenSea's signed zone {{claim:opensea-signed-zone-1-6}}.

WETH also sits inside other fixed cores. The Morpho Blue lending contract held
{{obs:weth9-held-by-morpho-blue-2026-10-01}} and the Uniswap v4 PoolManager held
{{obs:weth9-held-by-uniswap-v4-2026-10-01}} {{claim:onchain-core-balances-2026-10-01}}. These balances are part of WETH's
supply, not additional to it. Wrapping is no longer the only route: Uniswap v4 pools can pair native ETH directly, and
the same PoolManager held {{obs:eth-held-by-uniswap-v4-2026-10-01}}.

For a longer view, Zellic counted WETH9 in {{obs:weth9-transactions-2022}} {{claim:zellic-weth-usage-2022}}.

## Control in context

The wrapper is {{grade:weth9}} in EDI, and the ETH inside it is {{grade:native-eth}}. That assessment belongs to the one
contract at 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 on Ethereum. Tokens called WETH elsewhere are separate contracts
with their own rules {{claim:ethereum-org-weth-variants}}: {{subject:deployment:weth-base}}, for example, lives at a
different address on a different network {{claim:base-weth9-address}} and is not covered by this record.

What a holder approves is their own decision and their own exposure. An approval stays in force until it is used up or
revoked. Approving a marketplace's conduit lets every contract that the conduit's owner admits move the approved tokens
{{claim:conduit-captain-source}}. When WETH pays for an NFT on Seaport 1.6, the settlement core is
{{grade:seaport-v1.6}}, while the order's zone, conduit and NFT contract fall under a separate position review that is
{{grade:seaport-v1.6:position}}.
