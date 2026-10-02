export declare const rubric: {
    readonly schemaVersion: 1;
    readonly id: "ethereum-decentralization-index";
    readonly rubricVersion: "2.0";
    readonly paletteVersion: "cyberpunk-1";
    readonly reviewedAt: "2026-09-08";
    readonly scope: "An ordinal assessment of additional authority over assets and applications built on Ethereum. Scores are editorial approximations, not L2BEAT stages. An at-least score preserves known restrictions when an additional dependency remains unreviewed.";
    readonly aggregation: {
        readonly rule: "effectiveTier = max(asset or wrapper tier, containing protocol tier, every security-relevant ancestor and dependency tier)";
        readonly unknown: "If any material dependency is unreviewed, effectiveTier is null. knownFloor is the largest established tier, not a replacement for unknown.";
        readonly order: "Larger D means additional control. A child cannot have a numerically smaller effective D than an ancestor.";
        readonly composition: "Record dependencies by the actual capital path. Do not attach every product of a brand to every other product. Parallel independent exits can remove a dependency only after a specific review.";
        readonly nonCardinal: "Ordinal categories, not equal intervals: D4 is not twice as centralized as D2. Multiple controls at one tier remain visible in details.";
    };
    readonly limitations: readonly ["Ordinal control categories, not equal intervals or probabilities of loss.", "Holder custody is a separate assessment.", "An unknown dependency never becomes a complete review.", "Immutable code is not sufficient for D0 when a material dependency is controlled."];
    readonly grades: readonly [{
        readonly tier: 0;
        readonly label: "Maximum decentralization";
        readonly definition: "As decentralized as Ethereum L1 itself within the reviewed mechanism; no additional administrator can rewrite its principal or exit rules.";
        readonly id: "D0";
        readonly color: "#8bffff";
    }, {
        readonly tier: 1;
        readonly label: "Limited administration";
        readonly definition: "Bounded settings can change, while the reviewed asset custody and exit mechanism remains fixed.";
        readonly id: "D1";
        readonly color: "#32ff81";
    }, {
        readonly tier: 2;
        readonly label: "External operation";
        readonly definition: "An oracle, allocation role, pause or other external operation materially affects the position without arbitrary replacement of its core.";
        readonly id: "D2";
        readonly color: "#a8ff00";
    }, {
        readonly tier: 3;
        readonly label: "Delayed governance";
        readonly definition: "Governance can change the system through a documented delay; user vetoes and exit protections are assessed explicitly.";
        readonly id: "D3";
        readonly color: "#e5ff00";
    }, {
        readonly tier: 4;
        readonly label: "Independent emergency council";
        readonly definition: "An elected, accountable and diverse council can act immediately, alongside a delayed normal governance route.";
        readonly id: "D4";
        readonly color: "#fff000";
    }, {
        readonly tier: 5;
        readonly label: "Council and foundation";
        readonly definition: "A formally governed council shares immediate authority with a foundation, with additional foundation or fallback powers.";
        readonly id: "D5";
        readonly color: "#ffbf00";
    }, {
        readonly tier: 6;
        readonly label: "Council and operator";
        readonly definition: "An operator shares immediate authority with an appointed council, with limited public governance or removal rights.";
        readonly id: "D6";
        readonly color: "#ff8a24";
    }, {
        readonly tier: 7;
        readonly label: "Administrator upgrade";
        readonly definition: "A concentrated administrator or committee can replace core rules without a verified protective delay and independent veto.";
        readonly id: "D7";
        readonly color: "#ff5c44";
    }, {
        readonly tier: 8;
        readonly label: "Operator-governed validation";
        readonly definition: "The operator also restricts who may validate or challenge state, or can defeat ordinary inclusion or exit mechanisms.";
        readonly id: "D8";
        readonly color: "#ff405d";
    }, {
        readonly tier: 9;
        readonly label: "Issuer-controlled backing";
        readonly definition: "An issuer or custodian controls the backing, redemption or seizure of the asset. This dimension is additional to the chain it uses.";
        readonly id: "D9";
        readonly color: "#ff3152";
    }];
};
//# sourceMappingURL=rubric.d.ts.map