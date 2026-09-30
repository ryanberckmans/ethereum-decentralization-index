import {assessment, composeAssessments} from '../dist/core/index.js';
import {findReview, registryAssessment, validateRegistry} from '../dist/registry/index.js';

/** Coverage counts conserved holdings from an explicit cohort, never added TVLs. */
export function buildCoverage(input, database, asOf) {
  validateRegistry(database);
  if (input.schemaVersion !== 1 || !Array.isArray(input.holdings) || input.holdings.length > 10000 || !Array.isArray(input.protocols)) throw new Error('Invalid coverage input');
  const ids = new Set(input.protocols.map(p => p.id));
  if (ids.size !== input.protocols.length || input.protocols.some(p => p.chainId !== 'ethereum' || !p.id || !p.name)) throw new Error('Invalid L1 coverage cohort');
  const unique = new Set();
  for (const holding of input.holdings) {
    if (!ids.has(holding.protocolId) || !Number.isFinite(holding.usd) || holding.usd < 0 || typeof holding.assetId !== 'string' || typeof holding.positionUnresolved !== 'boolean') throw new Error('Invalid conserved holding');
    const key = `${holding.protocolId}/${holding.assetId}/${holding.positionUnresolved}`;
    if (unique.has(key)) throw new Error('Duplicate conserved holding');
    unique.add(key);
  }
  const assetId = id => input.assetReviews[id] ?? (id === 'weth:ethereum' ? 'weth9' : id);
  const rows = input.protocols.map(protocol => {
    const review = findReview(protocol.reviewId, database);
    const mechanism = registryAssessment(protocol.reviewId, asOf, {database});
    const positions = input.holdings.filter(h => h.protocolId === protocol.id);
    const completePositionUsd = positions.reduce((sum, holding) => {
      const value = composeAssessments([
        registryAssessment(protocol.reviewId, asOf, {scope: 'position', database}),
        registryAssessment(assetId(holding.assetId), asOf, {database}),
        registryAssessment('ethereum', asOf, {database}),
        ...(holding.positionUnresolved ? [assessment(null, {unresolved: ['Unresolved position configuration']})] : [])
      ]);
      return sum + (value.status === 'assessed' ? holding.usd : 0);
    }, 0);
    return {id: protocol.id, name: protocol.name, mechanismLevel: mechanism.effectiveLevel ?? mechanism.knownFloor,
      complete: mechanism.status === 'assessed', locatedUsd: positions.reduce((sum,h) => sum + h.usd, 0),
      positionCompleteUsd: completePositionUsd, reviewedAt: review?.reviewedAt ?? null, reviewCadence: review?.reviewCadence ?? null};
  }).sort((a,b) => a.id.localeCompare(b.id));
  const locatedUsd = rows.reduce((s,r) => s + r.locatedUsd, 0), completeMechanismUsd = rows.filter(r => r.complete).reduce((s,r) => s + r.locatedUsd, 0), completePositionUsd = rows.reduce((s,r) => s + r.positionCompleteUsd, 0);
  return {schemaVersion: 1, cycle: input.source.cycle, asOf, source: input.source,
    denominator: 'Conserved holdings located in this mapped Ethereum L1 protocol cohort. Reported TVLs are excluded; this is not the entire Ethereum application universe.',
    protocols: rows.length, mechanismsWithKnownRating: rows.filter(r => r.mechanismLevel !== null).length,
    completeMechanisms: rows.filter(r => r.complete).length, locatedUsd, completeMechanismUsd, completePositionUsd,
    completeMechanismShare: locatedUsd ? completeMechanismUsd / locatedUsd : 0,
    completePositionShare: locatedUsd ? completePositionUsd / locatedUsd : 0, rows};
}
