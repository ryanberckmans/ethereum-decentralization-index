---
ediId: native-eth
contentStatus: edited-profile
role: native-asset
summary: Ethereum's own currency. It pays for every transaction, secures the network through staking, and only the protocol issues or burns it.
capability: >-
  ETH is the one asset every Ethereum account can hold without a token contract or an issuer. It pays the fees of
  every transaction, validators stake it to propose and attest to blocks, and applications use it as money and
  collateral. Its supply changes only by protocol rule: new ETH rewards validators, and the base fee of every
  transaction is burned.
authority: >-
  No issuer, owner or administrator: native ETH follows Ethereum's account and consensus rules. Where ETH is placed is
  a separate matter. A custodian, staking service, bridge or wrapped form such as WETH adds its own controls and is
  assessed as its own object.
economicTags: [network fees, staking, money, collateral, fee burn]
aliases: [Ether, native ETH, native ether]
officialLinks:
  - label: What is ether (ethereum.org)
    url: https://ethereum.org/what-is-ether/
    checkedAt: 2026-10-02
  - label: Technical intro to ether (ethereum.org)
    url: https://ethereum.org/developers/docs/intro-to-ether/
    checkedAt: 2026-10-02
  - label: Gas and fees (ethereum.org)
    url: https://ethereum.org/developers/docs/gas/
    checkedAt: 2026-10-02
featuredObservationId: native-eth-base-fee-burned-2026-09
editorialReviewedAt: 2026-10-02
---

## What it enables

ETH is the asset Ethereum itself keeps account of. An account's balance is part of the protocol's state, not an entry
in a token contract {{claim:ethereum-org-accounts}}, so holding and sending ETH involves no issuer and no application.
Every transaction pays its fees in ETH, the only payment the protocol accepts {{claim:ethereum-org-ether-fees-only}}.
That makes ETH the one asset every user, wallet and contract needs, whatever else they hold.

ETH also secures the network. Since The Merge, the validators that propose and attest to blocks do so by staking ETH
{{claim:ethereum-org-staking}}, and new ETH is created only by the protocol, as their reward
{{claim:ethereum-org-ether-issuance}}. Each block's base fee is burned instead of paid to anyone
{{claim:ethereum-org-base-fee-burned}}, a rule in force since the London upgrade of August 2021
{{claim:ethereum-org-burn-since-london}} {{claim:eip-1559-base-fee-burned}}. Beyond the protocol, ETH serves as money
and as collateral in lending markets {{claim:ethereum-org-what-is-ether}}.

Contracts written for the ERC-20 token standard cannot hold ETH directly, because ETH is older than the standard.
{{object:weth9}} wraps it one for one so that they can {{claim:ethereum-org-why-weth}}, and newer cores such as
{{object:uniswap-v4}} pair native ETH without wrapping it {{claim:onchain-uniswap-v4-swaps-2026-09}}.

## Observed use

In September 2026 Ethereum mainnet included {{obs:ethereum-transactions-2026-09}}, each paid for in ETH
{{claim:onchain-ethereum-blocks-2026-09}}. Over the same blocks the protocol burned
{{obs:native-eth-base-fee-burned-2026-09}} in base fees, and a further {{obs:native-eth-blob-fee-burned-2026-09}} in
fees for the data blobs that rollups post to Ethereum {{claim:eip-4844-blob-fee-burned}}. Tips paid to validators are
not burned and are not counted.

ETH also works inside applications. The WETH9 contract held {{obs:weth9-eth-held-2026-10-01}} for WETH holders
{{claim:onchain-weth9-2026-10-01}}, the Uniswap v4 PoolManager held {{obs:eth-held-by-uniswap-v4-2026-10-01}} in pools
that pair native ETH {{claim:onchain-core-balances-2026-10-01}}, and the bridge of the Base network held
{{obs:base-portal-eth-2026-10-01}} for ETH moved there {{claim:onchain-base-2026-09}}. Each is a balance held for
others at one moment. None is additional ETH, and they are not added together.

## Control in context

ETH is {{grade:native-eth}} in EDI. The assessment covers ETH under Ethereum's own account and consensus rules on
mainnet, and stops there. Holding ETH through a custodian, staking it through a service, bridging it to
{{object:base}} or wrapping it as {{object:weth9}} each adds the controls of that arrangement, which EDI assesses as a
separate object. The burn is a protocol rule about supply, not a promise about ETH's price or a payment to its
holders.
