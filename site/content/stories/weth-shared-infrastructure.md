---
id: weth-shared-infrastructure
title: WETH as shared infrastructure
dek: >-
  A small contract from 2017, with no owner and no upgrades, still turns ETH into the token that NFT offers, exchanges
  and lenders use.
thesis: >-
  A fixed wrapper gave ETH a token interface that any application can rely on, and it carries real trade: nearly every
  NFT offer paid in tokens and filled on Seaport 1.6 in September 2026 was paid in WETH.
objectIds: [weth9, native-eth, seaport-v1.6]
contextualSubjectIds: [org:opensea, product:opensea-marketplace, deployment:weth-base]
collections: [d0-in-use]
outcome:
  mechanism: reusable-infrastructure
  state: reproduced-observation
  statement: >-
    WETH paid for 146,032 of the 146,151 NFT offers filled in tokens on Seaport 1.6 in September 2026, most of them
    OpenSea orders.
ethereumContribution: >-
  Ethereum runs the same WETH9 code for everyone, so every marketplace and contract can rely on one shared form of
  wrapped ETH. An accepted offer settles in one transaction: the NFT and the WETH both move, or neither does.
controlBoundary: >-
  WETH9 and the Seaport 1.6 core have no administrator. OpenSea's orders add its signed zone, which needs OpenSea's
  signature for each fill, and its conduit, whose owner decides which contracts may use buyers' approvals.
claimIds:
  - ethereum-org-why-weth
  - sourcify-weth9-source
  - onchain-weth9-2026-10-01
  - zellic-weth-verification
  - opensea-seaport-weth-example
  - opensea-sdk-conduit
  - opensea-weth-offers
  - opensea-seaport-1-6-orders
  - onchain-seaport16-2026-09
  - opensea-signed-zone-1-6
  - onchain-core-balances-2026-10-01
  - zellic-weth-usage-2022
  - opensea-offer-leverage
  - opensea-collection-offers
  - opensea-signed-zone-source
  - opensea-offchain-cancellation
  - onchain-opensea-conduit-2026-10-01
  - conduit-captain-source
  - ethereum-org-weth-variants
  - base-weth9-address
observationIds:
  - weth9-seaport16-offer-fills-2026-09
  - weth9-seaport16-offer-volume-2026-09
  - weth9-seaport16-nft-offer-fills-2026-09
  - seaport16-token-nft-offer-fills-2026-09
  - opensea-weth-offer-fills-2026-09
  - weth9-eth-held-2026-10-01
  - weth9-held-by-morpho-blue-2026-10-01
  - weth9-held-by-uniswap-v4-2026-10-01
  - eth-held-by-uniswap-v4-2026-10-01
  - weth9-transactions-2022
relationshipIds: [opensea-marketplace-weth9, opensea-marketplace-seaport16, weth9-seaport16]
reviewedAt: 2026-10-02
---

## Before

ETH is older than the ERC-20 token standard, so it does not have the functions that token software is written against
{{claim:ethereum-org-why-weth}}. The gap matters most when a contract has to move someone's money later. A token
holder can approve a contract to spend up to a set amount, but ETH in a wallet moves only when its owner sends it. An
offer to buy something with ETH therefore needs the ETH set aside in advance, held by a marketplace or a contract
until someone accepts.

## The mechanism

{{object:weth9}} is a few dozen lines of fixed code. Deposit ETH and it credits the same amount of WETH; withdraw WETH
and it returns the ETH; its total supply is the ETH it holds {{claim:sourcify-weth9-source}}. There is no owner and no
upgrade path, and the same code has run at the same address since 12 December 2017
{{claim:onchain-weth9-2026-10-01}}. Zellic formally verified that a depositor can always withdraw, whatever other users
do {{claim:zellic-weth-verification}}.

On {{object:seaport-v1.6}}, an offer is a signed order that names the WETH the buyer will give and the NFT they want in
return {{claim:opensea-seaport-weth-example}}. The buyer approves a conduit once to move their WETH
{{claim:opensea-sdk-conduit}}. When a seller accepts, Seaport moves the NFT to the buyer and the WETH to the seller in
the same transaction.

## Evidence of use

OpenSea requires offers on its marketplace to be made in WETH {{claim:opensea-weth-offers}}, and its new orders settle
on Seaport 1.6 {{claim:opensea-seaport-1-6-orders}}. The chain records the result. Makers paid with WETH in
{{obs:weth9-seaport16-offer-fills-2026-09}} on Seaport 1.6, spending {{obs:weth9-seaport16-offer-volume-2026-09}}
{{claim:onchain-seaport16-2026-09}}. Of {{obs:seaport16-token-nft-offer-fills-2026-09}} in which a token was offered
for an NFT, WETH paid for {{obs:weth9-seaport16-nft-offer-fills-2026-09}}. Nearly all the WETH fills,
{{obs:opensea-weth-offer-fills-2026-09}}, were orders that named OpenSea's signed zone
{{claim:opensea-signed-zone-1-6}}. These are order fills, not buyers: one collector can fill many offers.

The same contract serves other fixed cores. WETH9 held {{obs:weth9-eth-held-2026-10-01}}, including
{{obs:weth9-held-by-morpho-blue-2026-10-01}} in the Morpho Blue lending contract and
{{obs:weth9-held-by-uniswap-v4-2026-10-01}} in the Uniswap v4 PoolManager {{claim:onchain-core-balances-2026-10-01}}.
Over its first five years Zellic counted WETH9 in {{obs:weth9-transactions-2022}} {{claim:zellic-weth-usage-2022}}.

## What becomes possible

Because an offer is a signature and the payment is a token, a buyer does not have to lock up ETH for each bid. OpenSea
lets outstanding WETH offers total up to 1,000 times the buyer's WETH balance {{claim:opensea-offer-leverage}}, and a
collection offer can be filled by whichever holder accepts first {{claim:opensea-collection-offers}}. Whoever receives
WETH can unwrap it to ETH at any time, from the same contract, without asking anyone.

The same token form lets ETH sit in exchange pools and lending markets that treat every asset alike. Newer designs can
also skip the wrapper: Uniswap v4 pools pair native ETH directly, and the v4 PoolManager held
{{obs:eth-held-by-uniswap-v4-2026-10-01}}.

## What remains controlled

WETH9 itself is {{grade:weth9}}, the ETH it holds is {{grade:native-eth}}, and Seaport 1.6's settlement core is
{{grade:seaport-v1.6}}. The authority in an OpenSea offer sits around those cores:

- OpenSea's signed zone requires each fill to carry a signature from a signer its controller has approved
  {{claim:opensea-signed-zone-source}}. Cancelling an OpenSea order off-chain works by OpenSea no longer issuing those
  signatures {{claim:opensea-offchain-cancellation}}.
- Buyers approve OpenSea's conduit to move their WETH, and the conduit's owner decides which contracts may use that
  approval. On 1 October 2026 the owner was a contract run by a Safe multisig that needs 5 of its 7 signers, and three
  Seaport contracts were admitted {{claim:onchain-opensea-conduit-2026-10-01}} {{claim:conduit-captain-source}}.
- Each NFT contract keeps whatever controls its creator built into it.

EDI's position review of Seaport 1.6, which covers zones, conduits and NFT contracts, is
{{grade:seaport-v1.6:position}}. WETH on other networks, such as {{subject:deployment:weth-base}}, is a different
contract outside this story and outside WETH9's assessment {{claim:ethereum-org-weth-variants}}
{{claim:base-weth9-address}}.
