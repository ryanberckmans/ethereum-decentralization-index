import type {DLevel} from '../core/index.js';

export interface PositionReview {
  cadence: 'monthly';
  reviewedAt?: string;
  nextReviewAt: string;
  status: 'unresolved' | 'assessed';
  reason: string;
}

/** A research record for a specific mechanism, not a ticker-wide rating. */
export interface ControlEntity {
  id: string;
  name: string;
  kind: 'chain' | 'asset' | 'protocol';
  proposedTier: DLevel | null;
  assessment: 'assessed' | 'lower-bound' | 'unreviewed';
  scope: string;
  reason: string;
  controls: readonly string[];
  evidenceUrls: readonly string[];
  reviewedAt: string;
  aliases: readonly string[];
  dependencies: readonly string[];
  knownFloor?: DLevel;
  ownComponentTier?: DLevel;
  tierBound?: boolean;
  limits?: readonly string[];
  immutableIdentity?: string;
  canonicalAddresses?: Readonly<Record<string, string>>;
  reviewCadence: 'monthly' | 'permanent-D0';
  nextReviewAt: string | null;
  positionDependenciesUnreviewed?: boolean;
  positionReview?: PositionReview;
  researchAttemptedAt?: string;
  sourceProof?: {
    checkedAt: string;
    chainId: number;
    address: string;
    provider: 'sourcify-v2';
    runtimeSha256: string;
    sourcesSha256: string;
    contractName: string;
    proxyDetected: boolean;
    implementation?: {address: string; name: string};
    onchainCodeMatchedAt?: string;
    stateChecks?: readonly {method: string; value: string}[];
    authorityChecks?: readonly {method: string; value: string; block: string}[];
  };
  reviewChecks?: readonly string[];
  [field: string]: unknown;
}

export interface ControlRegistry {
  schemaVersion: number;
  lastUpdatedAt: string;
  policyUpdatedAt: string;
  entities: readonly ControlEntity[];
  [field: string]: unknown;
}
