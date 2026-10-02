export const rubric = {
    "schemaVersion": 1,
    "id": "ethereum-decentralization-index",
    "rubricVersion": "2.0",
    "paletteVersion": "cyberpunk-1",
    "reviewedAt": "2026-09-08",
    "scope": "An ordinal assessment of additional authority over assets and applications built on Ethereum. Scores are editorial approximations, not L2BEAT stages. An at-least score preserves known restrictions when an additional dependency remains unreviewed.",
    "aggregation": {
        "rule": "effectiveTier = max(asset or wrapper tier, containing protocol tier, every security-relevant ancestor and dependency tier)",
        "unknown": "If any material dependency is unreviewed, effectiveTier is null. knownFloor is the largest established tier, not a replacement for unknown.",
        "order": "Larger D means additional control. A child cannot have a numerically smaller effective D than an ancestor.",
        "composition": "Record dependencies by the actual capital path. Do not attach every product of a brand to every other product. Parallel independent exits can remove a dependency only after a specific review.",
        "nonCardinal": "Ordinal categories, not equal intervals: D4 is not twice as centralized as D2. Multiple controls at one tier remain visible in details."
    },
    "limitations": [
        "Ordinal control categories, not equal intervals or probabilities of loss.",
        "Holder custody is a separate assessment.",
        "An unknown dependency never becomes a complete review.",
        "Immutable code is not sufficient for D0 when a material dependency is controlled."
    ],
    "grades": [
        {
            "tier": 0,
            "label": "Maximum decentralization",
            "definition": "As decentralized as Ethereum L1 itself within the reviewed mechanism; no additional administrator can rewrite its principal or exit rules.",
            "id": "D0",
            "color": "#8bffff"
        },
        {
            "tier": 1,
            "label": "Limited administration",
            "definition": "Bounded settings can change, while the reviewed asset custody and exit mechanism remains fixed.",
            "id": "D1",
            "color": "#32ff81"
        },
        {
            "tier": 2,
            "label": "External operation",
            "definition": "An oracle, allocation role, pause or other external operation materially affects the position without arbitrary replacement of its core.",
            "id": "D2",
            "color": "#a8ff00"
        },
        {
            "tier": 3,
            "label": "Delayed governance",
            "definition": "Governance can change the system through a documented delay; user vetoes and exit protections are assessed explicitly.",
            "id": "D3",
            "color": "#e5ff00"
        },
        {
            "tier": 4,
            "label": "Independent emergency council",
            "definition": "An elected, accountable and diverse council can act immediately, alongside a delayed normal governance route.",
            "id": "D4",
            "color": "#fff000"
        },
        {
            "tier": 5,
            "label": "Council and foundation",
            "definition": "A formally governed council shares immediate authority with a foundation, with additional foundation or fallback powers.",
            "id": "D5",
            "color": "#ffbf00"
        },
        {
            "tier": 6,
            "label": "Council and operator",
            "definition": "An operator shares immediate authority with an appointed council, with limited public governance or removal rights.",
            "id": "D6",
            "color": "#ff8a24"
        },
        {
            "tier": 7,
            "label": "Administrator upgrade",
            "definition": "A concentrated administrator or committee can replace core rules without a verified protective delay and independent veto.",
            "id": "D7",
            "color": "#ff5c44"
        },
        {
            "tier": 8,
            "label": "Operator-governed validation",
            "definition": "The operator also restricts who may validate or challenge state, or can defeat ordinary inclusion or exit mechanisms.",
            "id": "D8",
            "color": "#ff405d"
        },
        {
            "tier": 9,
            "label": "Issuer-controlled backing",
            "definition": "An issuer or custodian controls the backing, redemption or seizure of the asset. This dimension is additional to the chain it uses.",
            "id": "D9",
            "color": "#ff3152"
        }
    ]
};
//# sourceMappingURL=rubric.js.map