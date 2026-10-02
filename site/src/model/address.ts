/** Address parsing shared by the server and the browser. */

export const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** Parses `0x…`, `1:0x…` or `eip155:1:0x…`. A bare address has no chain. */
export function parseAddressQuery(value: string): {chainId?: number; address: string} | null {
  const match = /^(?:eip155:)?(?:(\d{1,12}):)?(0x[0-9a-fA-F]{40})$/i.exec(value.trim());
  if (!match) return null;
  const chainId = match[1] === undefined ? undefined : Number(match[1]);
  if (chainId !== undefined && (!Number.isSafeInteger(chainId) || chainId <= 0)) return null;
  return chainId === undefined ? {address: match[2].toLowerCase()} : {chainId, address: match[2].toLowerCase()};
}

/** `0x1234…abcd`, for compact display; the full address stays in the markup. */
export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
