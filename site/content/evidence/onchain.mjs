#!/usr/bin/env node
/**
 * Reproduces the directory's onchain observations at pinned blocks.
 *
 *   ETH_RPC_URL=https://... BASE_RPC_URL=https://... node onchain.mjs           verify every read
 *   ETH_RPC_URL=https://... node onchain.mjs --only seaport16-fills-2026-09      verify some reads
 *   ETH_RPC_URL=https://... node onchain.mjs --write                             record results
 *
 * Reads are defined in onchain.json next to this file, each with its chain,
 * block and recorded result. Verification re-runs every read against the given
 * archive nodes, checks each pinned block hash, and exits non-zero on any
 * difference. --write records fresh results instead (use it only when adding a
 * read, never to paper over a mismatch).
 *
 * Log scans read windows of LOG_WINDOW blocks (default 1000). Some providers cap
 * eth_getLogs ranges; set LOG_RPC_URL_<chainId> to use a different node for logs.
 * Requires Node 22. Behind an HTTPS proxy, run with NODE_USE_ENV_PROXY=1.
 * No dependencies; nothing here is imported by the site.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const FILE = new URL('./onchain.json', import.meta.url);
const doc = JSON.parse(readFileSync(FILE, 'utf8'));
const args = process.argv.slice(2);
const write = args.includes('--write');
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const WINDOW = Number(process.env.LOG_WINDOW ?? 1000);

const rpcUrl = {1: process.env.ETH_RPC_URL, 8453: process.env.BASE_RPC_URL};
const logUrl = chainId => process.env[`LOG_RPC_URL_${chainId}`] ?? rpcUrl[chainId];

// Selectors and event topics, with the signatures they hash.
const SEL = {
  totalSupply: '0x18160ddd', // totalSupply()
  balanceOf: '0x70a08231', // balanceOf(address)
  decimals: '0x313ce567', // decimals()
};
const TOPIC = {
  // OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256)[],(uint8,address,uint256,uint256,address)[])
  seaportOrderFulfilled: '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31',
  mint: '0xab8530f87dc9b59234c4623bf917212bb2536d647574c8e7e5da92c2ede0c9f8', // Mint(address,address,uint256)
  burn: '0xcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5', // Burn(address,uint256)
  blacklisted: '0xffa4e6181777692565cf28528fc88fd1516ea86b56da075235fa575af6a4b855', // Blacklisted(address)
  unBlacklisted: '0x117e3210bb9aa7d9baff172026820255c6f6c30ba8999d1c2fd88e2848137c4e', // UnBlacklisted(address)
};

async function rpc(url, method, params, tries = 7) {
  if (!url) throw new Error(`No RPC URL configured for ${method}`);
  let last;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
      });
      const body = await response.json();
      if ('result' in body) return body.result;
      last = JSON.stringify(body.error);
    } catch (error) {
      last = String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw new Error(`${method} failed: ${last}`);
}

const hex = n => '0x' + BigInt(n).toString(16);
const iso = timestamp => new Date(Number(BigInt(timestamp)) * 1000).toISOString().replace('.000', '');
const uint = data => (data === '0x' ? 0n : BigInt(data));
const word = address => address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const units = (raw, decimals) => {
  const digits = raw.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
};

async function call(chainId, to, data, block) {
  return rpc(rpcUrl[chainId], 'eth_call', [{to, data}, hex(block)]);
}

async function scanLogs(chainId, address, topics, fromBlock, toBlock, onLogs) {
  const windows = [];
  for (let start = fromBlock; start <= toBlock; start += WINDOW) windows.push([start, Math.min(start + WINDOW - 1, toBlock)]);
  const ids = [];
  let next = 0;
  async function worker() {
    while (next < windows.length) {
      const [a, b] = windows[next++];
      const logs = await rpc(logUrl(chainId), 'eth_getLogs', [{address, topics, fromBlock: hex(a), toBlock: hex(b)}]);
      for (const log of logs) ids.push(`${BigInt(log.blockNumber)}:${BigInt(log.logIndex)}:${log.transactionHash}`);
      onLogs(logs);
    }
  }
  await Promise.all(Array.from({length: 4}, worker));
  ids.sort((x, y) => {
    const [xb, xl] = x.split(':').map(Number);
    const [yb, yl] = y.split(':').map(Number);
    return xb - yb || xl - yl;
  });
  return createHash('sha256').update(ids.map(id => `${id}\n`).join('')).digest('hex');
}

const words = data => {
  const body = data.slice(2);
  const out = [];
  for (let i = 0; i < body.length; i += 64) out.push(BigInt('0x' + body.slice(i, i + 64)));
  return out;
};

// Decodes a static return value: address, uint256 or address[].
const decode = (data, type) => {
  const w = data.slice(2).match(/.{64}/g) ?? [];
  const address = word => '0x' + word.slice(24);
  if (type === 'address') return address(w[0]);
  if (type === 'uint256') return BigInt('0x' + w[0]).toString();
  if (type === 'address[]') return w.slice(2, 2 + Number(BigInt('0x' + w[1]))).map(address);
  throw new Error(`Unknown return type ${type}`);
};

const READS = {
  async call({chainId, block, read}) {
    // A plain eth_call. `signature` names the function whose selector starts `data`.
    const raw = await call(chainId, read.to, read.data, block);
    return {raw, value: decode(raw, read.returns)};
  },
  async 'erc20.totalSupply'({chainId, block, read}) {
    const raw = uint(await call(chainId, read.token, SEL.totalSupply, block));
    const decimals = Number(uint(await call(chainId, read.token, SEL.decimals, block)));
    return {raw: raw.toString(), decimals, value: units(raw, decimals)};
  },
  async 'erc20.balanceOf'({chainId, block, read}) {
    const raw = uint(await call(chainId, read.token, SEL.balanceOf + word(read.holder), block));
    const decimals = Number(uint(await call(chainId, read.token, SEL.decimals, block)));
    return {raw: raw.toString(), decimals, value: units(raw, decimals)};
  },
  async 'eth.balance'({chainId, block, read}) {
    const raw = uint(await rpc(rpcUrl[chainId], 'eth_getBalance', [read.address, hex(block)]));
    return {raw: raw.toString(), decimals: 18, value: units(raw, 18)};
  },
  async 'code.firstBlock'({chainId, block, read}) {
    // Binary search for the first block at which the address has code.
    let lo = 1;
    let hi = block;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const code = await rpc(rpcUrl[chainId], 'eth_getCode', [read.address, hex(mid)]);
      if (code !== '0x') hi = mid;
      else lo = mid + 1;
    }
    const header = await rpc(rpcUrl[chainId], 'eth_getBlockByNumber', [hex(lo), false]);
    return {block: lo, timestamp: iso(header.timestamp)};
  },
  async 'fiattoken.events'({chainId, read}) {
    // Mint, Burn, Blacklisted and UnBlacklisted events of a FiatToken (USDC) contract.
    // Mints and burns are split by the minting or burning address into named groups;
    // addresses in no group are counted as `other`.
    const groupOf = new Map();
    for (const [name, addresses] of Object.entries(read.groups)) for (const address of addresses) groupOf.set(BigInt(address), name);
    const empty = () => ({mintEvents: 0, mintedRaw: 0n, burnEvents: 0, burnedRaw: 0n});
    const groups = Object.fromEntries([...Object.keys(read.groups), 'other'].map(name => [name, empty()]));
    const total = empty();
    let blacklistedEvents = 0;
    let unBlacklistedEvents = 0;
    const topics = [[TOPIC.mint, TOPIC.burn, TOPIC.blacklisted, TOPIC.unBlacklisted]];
    const fingerprint = await scanLogs(chainId, read.address, topics, read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        const [topic, account] = log.topics;
        if (topic === TOPIC.blacklisted) blacklistedEvents++;
        if (topic === TOPIC.unBlacklisted) unBlacklistedEvents++;
        if (topic !== TOPIC.mint && topic !== TOPIC.burn) continue;
        const amount = uint(log.data);
        const group = groups[groupOf.get(BigInt(account)) ?? 'other'];
        for (const sums of [group, total]) {
          if (topic === TOPIC.mint) {
            sums.mintEvents++;
            sums.mintedRaw += amount;
          } else {
            sums.burnEvents++;
            sums.burnedRaw += amount;
          }
        }
      }
    });
    const show = sums => ({
      mintEvents: sums.mintEvents,
      minted: units(sums.mintedRaw, read.decimals),
      burnEvents: sums.burnEvents,
      burned: units(sums.burnedRaw, read.decimals),
    });
    return {
      ...show(total),
      groups: Object.fromEntries(Object.entries(groups).map(([name, sums]) => [name, show(sums)])),
      blacklistedEvents,
      unBlacklistedEvents,
      logsFingerprintSha256: fingerprint,
    };
  },
  async 'seaport.orderFulfilled'({chainId, read}) {
    // Counts Seaport OrderFulfilled events and the use of one ERC-20 token in them,
    // optionally also for orders that name one zone (topic 2 of the event).
    // An event is one order filled; a matched trade emits one event per order.
    const token = BigInt(read.token);
    const zone = read.zone ? BigInt(read.zone) : null;
    const result = {events: 0, erc20OfferForNftEvents: 0, tokenOfferEvents: 0, tokenOfferForNftEvents: 0, tokenAnyEvents: 0, nativeConsiderationEvents: 0, tokenOfferAmountRaw: 0n};
    const zoned = {zoneEvents: 0, zoneTokenOfferEvents: 0, zoneTokenOfferAmountRaw: 0n};
    const fingerprint = await scanLogs(chainId, read.address, [TOPIC.seaportOrderFulfilled], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        const inZone = zone !== null && BigInt(log.topics[2]) === zone;
        const w = words(log.data);
        const o = Number(w[2] / 32n);
        const c = Number(w[3] / 32n);
        const offer = Array.from({length: Number(w[o])}, (_, i) => w.slice(o + 1 + 4 * i, o + 5 + 4 * i));
        const consideration = Array.from({length: Number(w[c])}, (_, i) => w.slice(c + 1 + 5 * i, c + 6 + 5 * i));
        const isToken = item => item[0] === 1n && item[1] === token; // itemType 1 = ERC20
        const offered = offer.filter(isToken);
        const considered = consideration.filter(isToken);
        const spent = offered.reduce((sum, item) => sum + item[3], 0n);
        const forNft = consideration.some(item => item[0] >= 2n && item[0] <= 5n); // ERC721/1155, with or without criteria
        result.events++;
        if (forNft && offer.some(item => item[0] === 1n)) result.erc20OfferForNftEvents++; // any ERC-20 offered for an NFT
        if (inZone) zoned.zoneEvents++;
        if (offered.length) {
          result.tokenOfferEvents++;
          result.tokenOfferAmountRaw += spent;
          if (forNft) result.tokenOfferForNftEvents++;
          if (inZone) {
            zoned.zoneTokenOfferEvents++;
            zoned.zoneTokenOfferAmountRaw += spent;
          }
        }
        if (offered.length || considered.length) result.tokenAnyEvents++;
        if (consideration.some(item => item[0] === 0n)) result.nativeConsiderationEvents++; // itemType 0 = native ETH
      }
    });
    return {
      ...result,
      tokenOfferAmountRaw: result.tokenOfferAmountRaw.toString(),
      tokenOfferAmount: units(result.tokenOfferAmountRaw, read.tokenDecimals),
      ...(zone === null
        ? {}
        : {
            ...zoned,
            zoneTokenOfferAmountRaw: zoned.zoneTokenOfferAmountRaw.toString(),
            zoneTokenOfferAmount: units(zoned.zoneTokenOfferAmountRaw, read.tokenDecimals),
          }),
      logsFingerprintSha256: fingerprint,
    };
  },
};

let failures = 0;
for (const [key, pinned] of Object.entries(doc.blocks)) {
  const [chainId, number] = key.split(':').map(Number);
  if (!rpcUrl[chainId]) continue;
  const header = await rpc(rpcUrl[chainId], 'eth_getBlockByNumber', [hex(number), false]);
  if (header.hash !== pinned.hash) {
    failures++;
    console.log(`MISMATCH block ${key}: ${header.hash} != ${pinned.hash}`);
  }
}
for (const entry of doc.reads) {
  if (only && !only.has(entry.id)) continue;
  if (!rpcUrl[entry.chainId]) {
    console.log(`skip     ${entry.id} (no RPC URL for chain ${entry.chainId})`);
    continue;
  }
  // Every block a read depends on is pinned by hash; --write pins new ones.
  for (const number of [entry.block, entry.read.fromBlock].filter(n => n !== undefined)) {
    const key = `${entry.chainId}:${number}`;
    if (doc.blocks[key]) continue;
    if (!write) {
      failures++;
      console.log(`MISMATCH ${entry.id}: block ${key} is not pinned`);
      continue;
    }
    const header = await rpc(rpcUrl[entry.chainId], 'eth_getBlockByNumber', [hex(number), false]);
    doc.blocks[key] = {hash: header.hash, timestamp: iso(header.timestamp)};
    console.log(`pinned   block ${key} ${header.hash}`);
  }
  const result = await READS[entry.read.kind](entry);
  if (write) {
    entry.result = result;
    console.log(`recorded ${entry.id} ${JSON.stringify(result)}`);
  } else if (JSON.stringify(result) === JSON.stringify(entry.result)) {
    console.log(`ok       ${entry.id}`);
  } else {
    failures++;
    console.log(`MISMATCH ${entry.id}\n  recorded ${JSON.stringify(entry.result)}\n  now      ${JSON.stringify(result)}`);
  }
}
if (write) writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
process.exit(failures ? 1 : 0);
