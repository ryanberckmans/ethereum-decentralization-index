---
ediId: base
contentStatus: edited-profile
role: network
summary: Coinbase's rollup on Ethereum. It orders its own transactions and posts its data and state to Ethereum, while Coinbase and a Security Council control its upgrades.
capability: >-
  Base is a separate network for applications that posts its transaction data to Ethereum, where proofs let anyone
  challenge an invalid state. ETH and tokens move between the two through Base's bridge, and companies build products
  on it for their own customers, such as Coinbase's crypto-backed loans.
authority: >-
  Coinbase runs the only sequencer that orders Base's transactions and the accounts that post its data and state.
  Upgrades need both a Coinbase multisig and 8 of 11 Security Council members, take effect without delay, and
  privileged roles can pause withdrawals.
economicTags: [rollup, layer 2, payments, bridging, consumer apps]
aliases: [Base mainnet, Base chain, Base L2]
officialLinks:
  - label: base.org
    url: https://www.base.org/
    checkedAt: 2026-10-02
  - label: Base documentation
    url: https://docs.base.org/
    checkedAt: 2026-10-02
  - label: Security Council for Base
    url: https://docs.base.org/specifications/security/security-council-for-base
    checkedAt: 2026-10-02
featuredObservationId: base-deposits-2026-09
editorialReviewedAt: 2026-10-02
---

## What it enables

Coinbase opened Base mainnet to everyone on 9 August 2023 {{claim:base-mainnet-launch}}, as chain ID 8453
{{claim:base-connect-docs}}. Base is a rollup built on Ethereum: its transaction data is posted to Ethereum, and proofs
let anyone challenge an invalid state {{claim:base-protocol-overview}}. Applications run on Base's own blocks, while
Ethereum keeps the record that anyone can use to check them, and that withdrawals back to Ethereum are proven against.

A network of its own lets a company reach its customers with onchain products while staying tied to Ethereum.
Coinbase's bitcoin-backed USDC loans, launched in January 2025, are built on Base and powered by Morpho
{{claim:coinbase-bitcoin-loans-launch}}. Circle issues USDC on Base as a separate contract from USDC on Ethereum
{{claim:circle-usdc-addresses}}, and WETH on Base is likewise a different contract from {{object:weth9}}
{{claim:base-weth9-address}}.

Base's software is changing. In February 2026 Base said it would move away from the OP Stack to a Base-operated stack
over the following months, while remaining a Stage 1 rollup {{claim:base-unified-stack-2026}}.

## Observed use

Ethereum records how Base connects to it. In September 2026 Base's portal contract on Ethereum received
{{obs:base-deposits-2026-09}}, transactions sent from Ethereum into Base with or without value, and completed
{{obs:base-withdrawals-2026-09}} back to Ethereum. Base also posted {{obs:base-state-proposals-2026-09}} of its state for
withdrawals to be proven against {{claim:onchain-base-2026-09}}. These count events on Ethereum only, not transactions
inside Base.

On 1 October 2026 the portal held {{obs:base-portal-eth-2026-10-01}} deposited through
{{object:base-canonical-bridge}} and not yet withdrawn. That ETH backs ETH on Base, so it is not additional to it.

On Base itself, Circle's USDC contract had {{obs:usdc-supply-base-2026-10-01}} outstanding the same day
{{claim:onchain-usdc-2026-10-01}}, and Morpho reported that Coinbase's variable-rate loans on Base had passed
{{obs:coinbase-active-loans-2026-09-22}} in active loans {{claim:morpho-coinbase-active-loans-2026-09}}. Both are Base
figures, never added to Ethereum's.

## Control in context

Base is {{grade:base}} in EDI. Its review finds that upgrades need two approvals, a Coinbase 3-of-6 multisig and 8 of
the 11 members of an appointed Security Council, with no window for users to leave before an upgrade takes effect, and
that privileged roles can pause withdrawals and change configuration. Base's documentation describes the same
two-approval arrangement {{claim:base-security-council-docs}}. L2BEAT, an independent tracker, rates Base at Stage 1 and
notes there is no delay on upgrades {{claim:l2beat-base}}.

Day to day, Base runs a single active sequencer {{claim:base-protocol-overview}}, and its batch sender, output proposer
and challenger are each an account managed by Coinbase Technologies {{claim:base-contracts-docs}}. A withdrawal to
Ethereum can be finalized only once the state it is proven against has passed its challenge window: 5 days with a
single proof, or 1 day when both a TEE proof and a ZK proof back the same proposal {{claim:base-withdrawals-docs}}.

The bridge inherits Base's upgrade and validation arrangements and is {{grade:base-canonical-bridge}} in EDI. Base in
turn settles on {{object:ethereum}}, which EDI assesses as {{grade:ethereum}}. Assets on Base keep their own issuers'
controls.
