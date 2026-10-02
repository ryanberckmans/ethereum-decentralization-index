---
ediId: seaport-v1.6
contentStatus: edited-profile
role: settlement
summary: An open settlement contract for NFT trades. It fills a signed order only if everyone receives what the order promises, with no owner who can change or pause it.
capability: >-
  Seaport 1.6 settles signed orders that exchange NFTs, tokens and ETH. A maker lists what they will give and what they
  must receive, so a buyer can leave a standing offer on one item or a whole collection and a seller can accept it
  later, without trusting each other or an escrow agent. Since version 1.6 an order's zone can also run checks before
  and after the tokens move.
authority: >-
  The core contract has no owner, upgrade path or pause. Control sits around it: the zone an order names can stop it
  from filling, a conduit's owner decides which contracts may spend the approvals it holds, and each NFT and token
  contract keeps its own rules.
economicTags: [NFT trading, offers, collection offers, order settlement, marketplace infrastructure]
aliases: [Seaport, Seaport 1.6, Seaport v1.6, OpenSea Seaport]
officialLinks:
  - label: Seaport repository and deployments
    url: https://github.com/ProjectOpenSea/seaport
    checkedAt: 2026-10-02
  - label: Seaport documentation (OpenSea)
    url: https://docs.opensea.io/docs/seaport
    checkedAt: 2026-10-02
  - label: Seaport hooks (OpenSea)
    url: https://docs.opensea.io/docs/seaport-hooks
    checkedAt: 2026-10-02
featuredObservationId: seaport16-fills-2026-09
editorialReviewedAt: 2026-10-02
---

## What it enables

Seaport is a marketplace protocol for buying and selling NFTs. Each order lists the items its maker will give, the
offer, and the items that must be received in return, each with its recipient, the consideration
{{claim:seaport-readme-orders}}. The contract settles an order only when both sides receive what it specifies
{{claim:opensea-seaport-weth-example}}, so strangers can trade without an escrow agent. OpenSea launched Seaport in May
2022 for all NFT builders, not only its own marketplace, and described the core contract as having no owner, no
upgrade path and no special privileges {{claim:seaport-launch-2022}}.

Because orders are signed in advance, a buyer can leave an offer standing. An offer can name one item or any item in a
collection, and the first holder who accepts it fills it {{claim:opensea-collection-offers}}. An order can also name a
zone, an account that runs extra checks and can cancel the order for its maker, and a conduit, a contract that holds
the token approvals the trade spends. Anyone can deploy either {{claim:seaport-zones-and-conduits}}.

Version 1.6, announced on 20 March 2024, turned zones into hooks {{claim:seaport-1-6-announcement}}. For a restricted
order, Seaport calls the order's zone before any token moves and again afterwards, and the fill fails if the zone
rejects it {{claim:seaport-hooks-docs}}. A collection can use this to enforce how its NFTs trade. OpenSea's
documentation still calls hooks an emergent and experimental feature.

## Observed use

In September 2026 the Seaport 1.6 contract on Ethereum recorded {{obs:seaport16-fills-2026-09}}
{{claim:onchain-seaport16-2026-09}}. A fill is one order completed. A matched trade completes two or more orders at
once, so fills are not trades, buyers or people.

Standing offers were a large part of that use. In {{obs:seaport16-token-nft-offer-fills-2026-09}} the maker had offered
an ERC-20 token for an NFT, and in {{obs:weth9-seaport16-nft-offer-fills-2026-09}} that token was
{{object:weth9}}. New OpenSea orders settle on Seaport 1.6 {{claim:opensea-seaport-1-6-orders}}, and
{{obs:opensea-zone-fills-2026-09}} named OpenSea's signed zone for the version {{claim:opensea-signed-zone-1-6}}. The
other fills named a different zone or none; the count does not show which interface created them.

OpenSea also says that every order created or filled on OpenSea uses Seaport {{claim:opensea-seaport-most-used}}. That
is OpenSea's own statement, covers every Seaport version and has not been measured here.

## Control in context

The settlement core is {{grade:seaport-v1.6}} in EDI. The assessment covers the contract on Ethereum at
0x0000000000000068F116a894984e2DB1123eB395, where it has had code since 15 March 2024
{{claim:onchain-seaport16-deployed}}. The Seaport repository lists the same address on other networks
{{claim:seaport-readme-addresses}}; each of those copies is a separate deployment.

A trade also depends on contracts the core does not control, and EDI reviews them as a separate position, shown as
{{grade:seaport-v1.6:position}}. The zone an order names can stop the fill: OpenSea's signed zone requires a signature
from a signer its controller has approved {{claim:opensea-signed-zone-source}}. A conduit's owner decides which
contracts may move the tokens approved to it, and a bad channel could move any of them
{{claim:seaport-conduit-controller-docs}}. On 1 October 2026 the OpenSea Conduit was owned by a contract whose owner is
a 5-of-7 Safe multisig, and it still let Seaport 1.5 use its approvals alongside 1.6
{{claim:onchain-opensea-conduit-2026-10-01}}, although OpenSea said in March 2024 that it would drop 1.5 in the
following months {{claim:opensea-seaport-1-6-migration}}. The NFT and token contracts being traded keep their own rules.
