// Navigation metadata, never assessment inputs. Other numeric IDs are read from
// explicit chain-ID statements in the pinned EDI scope. Starknet is not an EVM ID.
export const networkSources={
 arbitrum:{id:'42161',url:'https://docs.arbitrum.io/arbitrum-bridge/quickstart',checkedAt:'2026-10-02'},
 optimism:{id:'10',url:'https://docs.optimism.io/op-mainnet/network-information/connecting-to-op',checkedAt:'2026-10-02'},
};
export function networkIdentity(e:{id:string;scope:string}){
 if(e.id==='ethereum')return '1';
 if(e.id in networkSources)return networkSources[e.id as keyof typeof networkSources].id;
 return e.scope.match(/chain ID\s+(\d+)/i)?.[1]||e.id;
}
