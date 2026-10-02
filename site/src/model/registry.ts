/**
 * Identity helpers over the canonical EDI registry. Nothing here grades
 * anything; assessments come from `assess.ts`, which calls EDI.
 *
 * @cc [label:product] exact-deployment-identity
 * An object is identified by its EDI registry ID, and a deployment by chain ID
 * plus exact address. Tickers, brands and similar code never establish
 * identity, so a same-ticker token or another chain's deployment never
 * inherits a record or its assessment.
 */
import {findReviewByAddress, registry, type ControlEntity} from 'ethereum-decentralization-index/registry';

export type Entity = ControlEntity;
export type Kind = Entity['kind'];

export const entities: readonly Entity[] = registry.entities;
const byId = new Map(entities.map(entity => [entity.id, entity]));

export function entity(id: string): Entity | undefined {
  return byId.get(id);
}

/** Exact canonical ID only. Aliases are search aids, never identities. */
export function isEdiId(id: string): boolean {
  return byId.has(id);
}

/**
 * Numeric chain IDs of the networks EDI reviews. Every ID that EDI states in a
 * chain record's scope or identity is checked against this table by the tests;
 * OP Mainnet (10) and Arbitrum One (42161) are the networks' published IDs.
 * Starknet has no EVM chain ID and is identified by its record alone.
 */
export const CHAIN_IDS: Readonly<Record<string, number>> = {
  ethereum: 1,
  optimism: 10,
  unichain: 130,
  zksync: 324,
  world: 480,
  robinhood: 4663,
  mantle: 5000,
  soneium: 1868,
  base: 8453,
  arbitrum: 42161,
  celo: 42220,
  ink: 57073,
  linea: 59144,
  scroll: 534352,
};
const chainEntityById = new Map(Object.entries(CHAIN_IDS).map(([id, chainId]) => [chainId, id]));

/** The EDI chain record for a numeric chain ID, if EDI reviews that network. */
export function chainRecord(chainId: number): Entity | undefined {
  const id = chainEntityById.get(chainId);
  return id ? byId.get(id) : undefined;
}

export interface Deployment {
  chainId: number;
  address: string;
}

/** Recorded deployment addresses, chain-qualified, in chain order. */
export function deployments(subject: Entity): Deployment[] {
  return Object.entries(subject.canonicalAddresses ?? {})
    .map(([chainId, address]) => ({chainId: Number(chainId), address: address.toLowerCase()}))
    .sort((a, b) => a.chainId - b.chainId);
}

/**
 * Networks EDI records for an object, as chain record IDs: a chain is its own
 * network; otherwise the chains of its recorded addresses; otherwise a direct
 * dependency on a chain. Native ETH's identity is Ethereum mainnet by EDI's
 * immutable identity. An empty list means EDI records no network.
 */
export function networksOf(subject: Entity): string[] {
  if (subject.kind === 'chain') return [subject.id];
  if (subject.id === 'native-eth') return ['ethereum'];
  const fromAddresses = deployments(subject).flatMap(d => {
    const chain = chainEntityById.get(d.chainId);
    return chain ? [chain] : [];
  });
  if (fromAddresses.length) return [...new Set(fromAddresses)];
  return subject.dependencies.filter(id => byId.get(id)?.kind === 'chain');
}

/** All networks that appear in the directory, Ethereum first, then by name. */
export function networkChoices(): Entity[] {
  const used = new Set(entities.flatMap(networksOf));
  return entities
    .filter(e => e.kind === 'chain' && used.has(e.id))
    .sort((a, b) => (a.id === 'ethereum' ? -1 : b.id === 'ethereum' ? 1 : a.name.localeCompare(b.name)));
}

/** EDI records that depend directly on `id` for control. */
const dependents = new Map<string, string[]>();
for (const subject of entities)
  for (const dependency of subject.dependencies) dependents.set(dependency, [...(dependents.get(dependency) ?? []), subject.id]);
export function dependentsOf(id: string): string[] {
  return dependents.get(id) ?? [];
}

/** Exact address lookup through EDI; an unknown deployment stays unknown. */
export function recordForAddress(chainId: number, address: string): Entity | undefined {
  return findReviewByAddress(chainId, address);
}

export {ADDRESS, parseAddressQuery} from './address.ts';
