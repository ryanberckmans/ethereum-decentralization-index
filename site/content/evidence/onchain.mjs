#!/usr/bin/env node
/**
 * Reproduces the directory's onchain observations at pinned blocks.
 *
 *   ETH_RPC_URL=https://... BASE_RPC_URL=https://... node onchain.mjs           verify every read
 *   ETH_RPC_URL=https://... node onchain.mjs --only seaport16-fills-2026-09      verify some reads
 *   ETH_RPC_URL=https://... node onchain.mjs --only <id> --write                 record a new read
 *
 * Reads are defined in onchain.json next to this file, each with its chain,
 * block and recorded result. Verification re-runs every read against the given
 * archive nodes, checks each pinned block hash, and exits non-zero on any
 * difference. --write records fresh results instead (use it only when adding a
 * read, never to paper over a mismatch).
 *
 * Bulk work (log scans and block-by-block reads) goes to LOG_RPC_URL_<chainId>
 * when it is set, so a node with generous log limits can serve it. A log scan
 * starts with the read's window (default 1000 blocks, capped by LOG_WINDOW) and
 * splits any window the node refuses as too large. BATCH sets how many calls go
 * in one JSON-RPC batch (default 10) and WORKERS how many requests run at once
 * (default 4). Requires Node 22; behind an HTTPS proxy, run with
 * NODE_USE_ENV_PROXY=1. No dependencies; nothing here is imported by the site.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const FILE = new URL('./onchain.json', import.meta.url);
const doc = JSON.parse(readFileSync(FILE, 'utf8'));
const args = process.argv.slice(2);
const write = args.includes('--write');
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const MAX_WINDOW = Number(process.env.LOG_WINDOW ?? Infinity);
const BATCH = Number(process.env.BATCH ?? 10);
const WORKERS = Number(process.env.WORKERS ?? 4);

const rpcUrl = {1: process.env.ETH_RPC_URL, 8453: process.env.BASE_RPC_URL};
const bulkUrl = chainId => process.env[`LOG_RPC_URL_${chainId}`] ?? rpcUrl[chainId];

// Selectors and event topics, with the signatures they hash.
const SEL = {
  totalSupply: '0x18160ddd', // totalSupply()
  balanceOf: '0x70a08231', // balanceOf(address)
  decimals: '0x313ce567', // decimals()
  token0: '0x0dfe1681', // token0()
  token1: '0xd21220a7', // token1()
  fee: '0xddca3f43', // fee()
  getPair: '0xe6a43905', // getPair(address,address)
  tokenAddress: '0x9d76ea58', // tokenAddress(), on a Uniswap v1 exchange
  getExchange: '0x06f2bf62', // getExchange(address), on the Uniswap v1 factory
  getPool: '0x1698ee82', // getPool(address,address,uint24)
  morphoMarket: '0x5c60e39a', // market(bytes32)
  morphoIdToMarketParams: '0x2c3c9157', // idToMarketParams(bytes32)
};
const TOPIC = {
  // OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256)[],(uint8,address,uint256,uint256,address)[])
  seaportOrderFulfilled: '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31',
  mint: '0xab8530f87dc9b59234c4623bf917212bb2536d647574c8e7e5da92c2ede0c9f8', // Mint(address,address,uint256)
  burn: '0xcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5', // Burn(address,uint256)
  blacklisted: '0xffa4e6181777692565cf28528fc88fd1516ea86b56da075235fa575af6a4b855', // Blacklisted(address)
  unBlacklisted: '0x117e3210bb9aa7d9baff172026820255c6f6c30ba8999d1c2fd88e2848137c4e', // UnBlacklisted(address)
  transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer(address,address,uint256)
  // Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)
  v4Initialize: '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438',
  // Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)
  v4Swap: '0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f',
  // CreateMarket(bytes32,(address,address,address,address,uint256))
  morphoCreateMarket: '0xac4b2400f169220b0c0afdde7a0b32e775ba727ea1cb30b35f935cdaab8683ac',
  // Borrow(bytes32,address,address,address,uint256,uint256)
  morphoBorrow: '0x570954540bed6b1304a87dfe815a5eda4a648f7097a16240dcd85c9b5fd42a43',
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
class LimitError extends Error {}
const isLimit = message => !/rate limit|too many requests/i.test(message) && /more than|too many|exceed|maximum|range|limit|size/i.test(message);
const isRevert = error => error?.code === 3 || /revert|invalid opcode|out of gas|vm exception|invalid jump|stack underflow/i.test(String(error?.message));

async function post(url, body) {
  if (!url) throw new Error('No RPC URL configured');
  const response = await fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  return response.json();
}

// Retries failures with backoff, waiting up to 30 seconds between attempts.
const backoff = attempt => sleep(Math.min(30_000, 500 * 2 ** attempt));

async function rpc(url, method, params, tries = 16) {
  let last;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const body = await post(url, {jsonrpc: '2.0', id: 1, method, params});
      if ('result' in body) return body.result;
      last = JSON.stringify(body.error);
      if (method === 'eth_getLogs' && isLimit(last)) throw new LimitError(last);
    } catch (error) {
      if (error instanceof LimitError) throw error;
      last = String(error);
    }
    await backoff(attempt);
  }
  throw new Error(`${method} failed: ${last}`);
}

// Sends calls ([method, params] pairs) as JSON-RPC batches and returns {result} or,
// with allowReverts, {error} for calls that revert. Anything else is retried.
async function rpcBatch(url, calls, {allowReverts = false} = {}) {
  const out = new Array(calls.length);
  let pending = calls.map((_, i) => i);
  for (let attempt = 0; pending.length && attempt < 16; attempt++) {
    if (attempt) await backoff(attempt - 1);
    let replies;
    try {
      replies = await post(url, pending.map(i => ({jsonrpc: '2.0', id: i, method: calls[i][0], params: calls[i][1]})));
    } catch {
      continue;
    }
    if (!Array.isArray(replies)) continue;
    const byId = new Map(replies.map(reply => [reply.id, reply]));
    pending = pending.filter(i => {
      const reply = byId.get(i);
      if (reply && 'result' in reply && reply.result !== null) out[i] = {result: reply.result};
      else if (reply && allowReverts && isRevert(reply.error)) out[i] = {error: reply.error};
      else return true;
      return false;
    });
  }
  if (pending.length) throw new Error(`${pending.length} batched calls failed, e.g. ${JSON.stringify(calls[pending[0]])}`);
  return out;
}

// Runs fn over chunks of items, WORKERS chunks at a time, and returns the results in order.
async function inChunks(items, size, fn) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  const results = new Array(chunks.length);
  let next = 0;
  await Promise.all(
    Array.from({length: WORKERS}, async () => {
      while (next < chunks.length) {
        const k = next++;
        results[k] = await fn(chunks[k]);
      }
    }),
  );
  return results.flat();
}

const hex = n => '0x' + BigInt(n).toString(16);
const iso = timestamp => new Date(Number(BigInt(timestamp)) * 1000).toISOString().replace('.000', '');
const uint = data => (data === '0x' ? 0n : BigInt(data));
const word = value => BigInt(value).toString(16).padStart(64, '0');
const units = (raw, decimals) => {
  const negative = raw < 0n;
  const digits = (negative ? -raw : raw).toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '');
  return (negative ? '-' : '') + (fraction ? `${whole}.${fraction}` : whole);
};
const words = data => {
  const body = data.slice(2);
  const out = [];
  for (let i = 0; i < body.length; i += 64) out.push(BigInt('0x' + body.slice(i, i + 64)));
  return out;
};
const asAddress = value => '0x' + BigInt(value).toString(16).padStart(40, '0');
// A 32-byte return value that holds a number below 2^bits, or null.
const fits = (data, bits) => (typeof data === 'string' && /^0x[0-9a-fA-F]{64}$/.test(data) && BigInt(data) < 1n << BigInt(bits) ? BigInt(data) : null);

async function call(chainId, to, data, block) {
  return rpc(rpcUrl[chainId], 'eth_call', [{to, data}, hex(block)]);
}

// Reads every log matching the filter from fromBlock to toBlock and passes each
// window's logs to onLogs, in no particular order.
async function scanLogs(chainId, address, topics, fromBlock, toBlock, onLogs, window = 1000) {
  const url = bulkUrl(chainId);
  const size = Math.max(1, Math.min(window, MAX_WINDOW));
  const queue = [];
  for (let start = fromBlock; start <= toBlock; start += size) queue.push([start, Math.min(start + size - 1, toBlock)]);
  let active = 0;
  async function worker() {
    for (;;) {
      const range = queue.shift();
      if (!range) {
        if (!active) return;
        await sleep(100);
        continue;
      }
      active++;
      try {
        const filter = {topics, fromBlock: hex(range[0]), toBlock: hex(range[1])};
        if (address) filter.address = address;
        onLogs(await rpc(url, 'eth_getLogs', [filter]));
      } catch (error) {
        if (!(error instanceof LimitError) || range[0] === range[1]) throw error;
        const middle = Math.floor((range[0] + range[1]) / 2);
        queue.unshift([range[0], middle], [middle + 1, range[1]]);
      } finally {
        active--;
      }
    }
  }
  await Promise.all(Array.from({length: WORKERS}, worker));
}

// A compact record of matched logs. Its fingerprint is the SHA-256 of
// "block:logIndex:txHash\n" for every kept log, in chain order.
class LogSet {
  constructor() {
    this.size = 0;
    this.grow(1 << 12);
  }
  grow(capacity) {
    const next = {block: new Uint32Array(capacity), index: new Uint32Array(capacity), tag: new Uint32Array(capacity), tx: new Uint8Array(capacity * 32)};
    if (this.block) for (const key of ['block', 'index', 'tag', 'tx']) next[key].set(this[key]);
    Object.assign(this, next, {capacity});
  }
  add(log, tag = 0) {
    if (this.size === this.capacity) this.grow(this.capacity * 2);
    const i = this.size++;
    this.block[i] = Number(log.blockNumber);
    this.index[i] = Number(log.logIndex);
    this.tag[i] = tag;
    this.tx.set(Buffer.from(log.transactionHash.slice(2), 'hex'), i * 32);
  }
  count(keep = () => true) {
    let n = 0;
    for (let i = 0; i < this.size; i++) if (keep(this.tag[i])) n++;
    return n;
  }
  fingerprint(keep = () => true) {
    const order = [];
    for (let i = 0; i < this.size; i++) if (keep(this.tag[i])) order.push(i);
    order.sort((a, b) => this.block[a] - this.block[b] || this.index[a] - this.index[b]);
    const hash = createHash('sha256');
    const tx = Buffer.from(this.tx.buffer, this.tx.byteOffset, this.tx.byteLength);
    let lines = '';
    for (const i of order) {
      lines += `${this.block[i]}:${this.index[i]}:0x${tx.toString('hex', i * 32, i * 32 + 32)}\n`;
      if (lines.length > 1 << 20) {
        hash.update(lines);
        lines = '';
      }
    }
    return hash.update(lines).digest('hex');
  }
}

// Decodes a return value: address, uint256, bool, address[] or string.
const decode = (data, type) => {
  const w = data.slice(2).match(/.{64}/g) ?? [];
  const address = word => '0x' + word.slice(24);
  if (type === 'address') return address(w[0]);
  if (type === 'uint256') return BigInt('0x' + w[0]).toString();
  if (type === 'bool') return BigInt('0x' + w[0]) !== 0n;
  if (type === 'address[]') return w.slice(2, 2 + Number(BigInt('0x' + w[1]))).map(address);
  if (type === 'string') {
    const at = Number(BigInt('0x' + w[0])) / 32;
    const length = Number(BigInt('0x' + w[at]));
    return Buffer.from(w.slice(at + 1).join('').slice(0, length * 2), 'hex').toString('utf8');
  }
  throw new Error(`Unknown return type ${type}`);
};

// Morpho Blue markets created from fromBlock to toBlock: id -> market parameters.
async function morphoMarkets(chainId, morpho, fromBlock, toBlock, set) {
  const markets = new Map();
  await scanLogs(chainId, morpho, [TOPIC.morphoCreateMarket], fromBlock, toBlock, logs => {
    for (const log of logs) {
      const [loanToken, collateralToken, oracle, irm, lltv] = words(log.data);
      markets.set(log.topics[1], {loanToken, collateralToken, oracle, irm, lltv});
      set.add(log);
    }
  }, 1_000_000);
  return markets;
}

// market(id) at a block: supplied and borrowed totals as last accrued.
async function morphoMarketStates(chainId, morpho, ids, block) {
  const replies = await inChunks(ids, BATCH, chunk => rpcBatch(rpcUrl[chainId], chunk.map(id => ['eth_call', [{to: morpho, data: SEL.morphoMarket + id.slice(2)}, hex(block)]])));
  return replies.map(({result}) => {
    const [totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares, lastUpdate, fee] = words(result);
    return {totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares, lastUpdate, fee};
  });
}

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
  async 'logs.count'({chainId, read}) {
    // Every log from `address` with these topics in the block range.
    const set = new LogSet();
    await scanLogs(chainId, read.address, read.topics, read.fromBlock, read.toBlock, logs => logs.forEach(log => set.add(log)), read.window);
    return {events: set.size, logsFingerprintSha256: set.fingerprint()};
  },
  async 'erc20.transfers'({chainId, read}) {
    // Transfer events of one token: mints come from the zero address, burns go to it,
    // and everything else is a transfer between holders.
    const sums = {transferEvents: 0, transferredRaw: 0n, mintEvents: 0, mintedRaw: 0n, burnEvents: 0, burnedRaw: 0n};
    const set = new LogSet();
    await scanLogs(chainId, read.token, [TOPIC.transfer], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        set.add(log);
        const amount = uint(log.data);
        if (BigInt(log.topics[1]) === 0n) {
          sums.mintEvents++;
          sums.mintedRaw += amount;
        } else if (BigInt(log.topics[2]) === 0n) {
          sums.burnEvents++;
          sums.burnedRaw += amount;
        } else {
          sums.transferEvents++;
          sums.transferredRaw += amount;
        }
      }
    }, read.window);
    return {
      transferEvents: sums.transferEvents,
      transferred: units(sums.transferredRaw, read.decimals),
      mintEvents: sums.mintEvents,
      minted: units(sums.mintedRaw, read.decimals),
      burnEvents: sums.burnEvents,
      burned: units(sums.burnedRaw, read.decimals),
      logsFingerprintSha256: set.fingerprint(),
    };
  },
  async 'erc20.holderTransferCalls'({chainId, read}) {
    // Transfers between holders of one token (neither side the zero address) in the block
    // range, counted by the contract each transaction called: the token itself for a direct
    // transfer, or a router, settlement or other contract that moved the tokens.
    const set = new LogSet();
    const logs = [];
    await scanLogs(chainId, read.token, [TOPIC.transfer], read.fromBlock, read.toBlock, batch => {
      for (const log of batch) {
        if (BigInt(log.topics[1]) === 0n || BigInt(log.topics[2]) === 0n) continue;
        set.add(log);
        logs.push(log);
      }
    }, read.window);
    const hashes = [...new Set(logs.map(log => log.transactionHash))].sort();
    const txs = await inChunks(hashes, BATCH, chunk => rpcBatch(rpcUrl[chainId], chunk.map(hash => ['eth_getTransactionByHash', [hash]])));
    const called = new Map(hashes.map((hash, i) => [hash, txs[i].result.to.toLowerCase()]));
    const byCalledContract = {};
    for (const log of logs) {
      const to = called.get(log.transactionHash);
      byCalledContract[to] = (byCalledContract[to] ?? 0) + 1;
    }
    return {
      transferEvents: logs.length,
      transactions: hashes.length,
      senders: new Set(logs.map(log => log.topics[1])).size,
      receivers: new Set(logs.map(log => log.topics[2])).size,
      byCalledContract: Object.fromEntries(Object.entries(byCalledContract).sort(([a], [b]) => (a < b ? -1 : 1))),
      logsFingerprintSha256: set.fingerprint(),
    };
  },
  async 'token.frozen'({chainId, block, read}) {
    // Addresses a token's issuer froze (or blocklisted) from fromBlock to `block`, and how
    // many of them the token's own check function still reports as frozen at `block`.
    const counts = {frozenEvents: 0, unfrozenEvents: 0, wipedEvents: 0};
    const everFrozen = new Set();
    const set = new LogSet();
    const topics = [[read.frozenTopic, read.unfrozenTopic, read.wipedTopic].filter(Boolean)];
    await scanLogs(chainId, read.token, topics, read.fromBlock, block, logs => {
      for (const log of logs) {
        set.add(log);
        if (log.topics[0] === read.frozenTopic) {
          counts.frozenEvents++;
          everFrozen.add(asAddress(log.topics[1]));
        } else if (log.topics[0] === read.unfrozenTopic) counts.unfrozenEvents++;
        else counts.wipedEvents++;
      }
    }, read.window);
    const addresses = [...everFrozen].sort();
    const checks = await inChunks(addresses, BATCH, chunk =>
      rpcBatch(rpcUrl[chainId], chunk.map(address => ['eth_call', [{to: read.token, data: read.check + word(address)}, hex(block)]])),
    );
    return {
      ...counts,
      addressesEverFrozen: addresses.length,
      frozenAtBlock: checks.filter(({result}) => uint(result) === 1n).length,
      logsFingerprintSha256: set.fingerprint(),
    };
  },
  async 'blocks.summary'({chainId, read}) {
    // Every block from fromBlock to toBlock: its transactions, gas used, base fee burned
    // (baseFeePerGas × gasUsed) and blob fee burned (the block's blob base fee, from
    // eth_feeHistory, × blobGasUsed).
    const url = bulkUrl(chainId);
    const numbers = Array.from({length: read.toBlock - read.fromBlock + 1}, (_, i) => read.fromBlock + i);
    const sums = {blocks: 0, transactions: 0, gasUsed: 0n, baseFeeWei: 0n, blocksWithBlobs: 0, blobGasUsed: 0n, blobFeeWei: 0n};
    const blobGas = new Map();
    await inChunks(numbers, BATCH, async chunk => {
      for (const {result: block} of await rpcBatch(url, chunk.map(n => ['eth_getBlockByNumber', [hex(n), false]]))) {
        const gas = BigInt(block.gasUsed);
        sums.blocks++;
        sums.transactions += block.transactions.length;
        sums.gasUsed += gas;
        sums.baseFeeWei += BigInt(block.baseFeePerGas) * gas;
        const blob = BigInt(block.blobGasUsed ?? 0);
        if (blob) {
          sums.blocksWithBlobs++;
          sums.blobGasUsed += blob;
          blobGas.set(Number(block.number), blob);
        }
      }
      return [];
    });
    if (sums.blocks !== numbers.length) throw new Error(`read ${sums.blocks} of ${numbers.length} blocks`);
    for (let end = read.toBlock; end >= read.fromBlock; end -= 1024) {
      const start = Math.max(read.fromBlock, end - 1023);
      const history = await rpc(url, 'eth_feeHistory', [hex(end - start + 1), hex(end), []]);
      if (Number(history.oldestBlock) !== start) throw new Error(`eth_feeHistory started at ${history.oldestBlock}, not ${start}`);
      for (let n = start; n <= end; n++) if (blobGas.has(n)) sums.blobFeeWei += BigInt(history.baseFeePerBlobGas[n - start]) * blobGas.get(n);
    }
    return {
      blocks: sums.blocks,
      transactions: sums.transactions,
      gasUsed: sums.gasUsed.toString(),
      baseFeeBurned: units(sums.baseFeeWei, 18),
      blocksWithBlobs: sums.blocksWithBlobs,
      blobGasUsed: sums.blobGasUsed.toString(),
      blobFeeBurned: units(sums.blobFeeWei, 18),
    };
  },
  async 'uniswap.pairSwaps'({chainId, read}) {
    // Swap events with this topic (or any of swapTopics) from any contract in the block range,
    // kept only when the emitting contract is the factory's own pool for its tokens at toBlock:
    // for version 1, factory.getExchange(tokenAddress); for version 2,
    // factory.getPair(token0, token1); for version 3, factory.getPool(token0, token1, fee).
    const set = new LogSet();
    const emitters = [];
    const tagOf = new Map();
    await scanLogs(chainId, null, [read.swapTopics ?? read.swapTopic], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        const address = log.address.toLowerCase();
        if (!tagOf.has(address)) {
          tagOf.set(address, emitters.length);
          emitters.push(address);
        }
        set.add(log, tagOf.get(address));
      }
    }, read.window);
    const v1 = read.version === 1;
    const v3 = read.version === 3;
    const getters = v1 ? [SEL.tokenAddress] : v3 ? [SEL.token0, SEL.token1, SEL.fee] : [SEL.token0, SEL.token1];
    const answers = await inChunks(emitters, BATCH, chunk =>
      rpcBatch(rpcUrl[chainId], chunk.flatMap(address => getters.map(data => ['eth_call', [{to: address, data}, hex(read.toBlock)]])), {allowReverts: true}),
    );
    const candidates = [];
    emitters.forEach((address, i) => {
      const [token0, token1, fee] = getters.map((_, g) => answers[i * getters.length + g].result);
      if (v1) {
        // v1 exchanges, compiled with an early Vyper, pad this return far past one word.
        const token = fits(typeof token0 === 'string' ? token0.slice(0, 66) : token0, 160);
        if (token !== null) candidates.push({tag: i, data: SEL.getExchange + word(token)});
        return;
      }
      const a = fits(token0, 160);
      const b = fits(token1, 160);
      const f = v3 ? fits(fee, 24) : 0n;
      if (a === null || b === null || f === null) return;
      candidates.push({tag: i, data: (v3 ? SEL.getPool : SEL.getPair) + word(a) + word(b) + (v3 ? word(f) : '')});
    });
    const lookups = await inChunks(candidates, BATCH, chunk =>
      rpcBatch(rpcUrl[chainId], chunk.map(({data}) => ['eth_call', [{to: read.factory, data}, hex(read.toBlock)]])),
    );
    const authentic = new Set();
    candidates.forEach(({tag}, i) => {
      if (fits(lookups[i].result, 160) === BigInt(emitters[tag])) authentic.add(tag);
    });
    const keep = tag => authentic.has(tag);
    return {
      events: set.count(keep),
      pools: authentic.size,
      otherEvents: set.size - set.count(keep),
      otherContracts: emitters.length - authentic.size,
      logsFingerprintSha256: set.fingerprint(keep),
    };
  },
  async 'uniswap.v4Swaps'({chainId, read}) {
    // Pools initialized in the PoolManager from deployBlock to toBlock, and its Swap events
    // from fromBlock to toBlock, split by whether the pool has a hook. Named hooks are
    // counted separately.
    const pools = new Map();
    const initialized = new LogSet();
    await scanLogs(chainId, read.address, [TOPIC.v4Initialize], read.deployBlock, read.toBlock, logs => {
      for (const log of logs) {
        const [, , hooks] = words(log.data);
        pools.set(log.topics[1], {hooks, native: BigInt(log.topics[2]) === 0n});
        initialized.add(log);
      }
    }, read.initializeWindow);
    const swaps = new LogSet();
    const swapsByPool = new Map();
    await scanLogs(chainId, read.address, [TOPIC.v4Swap], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        swapsByPool.set(log.topics[1], (swapsByPool.get(log.topics[1]) ?? 0) + 1);
        swaps.add(log);
      }
    }, read.swapWindow);
    const named = Object.fromEntries(Object.keys(read.hooks ?? {}).map(name => [name, {pools: 0, poolsSwapped: 0, swapEvents: 0}]));
    const nameOf = new Map(Object.entries(read.hooks ?? {}).map(([name, address]) => [BigInt(address), name]));
    for (const pool of pools.values()) if (nameOf.has(pool.hooks)) named[nameOf.get(pool.hooks)].pools++;
    const result = {poolsInitialized: pools.size, poolsWithHooks: [...pools.values()].filter(pool => pool.hooks !== 0n).length};
    const sums = {swapEvents: 0, swapEventsWithoutHooks: 0, swapEventsWithHooks: 0, swapEventsNativeEth: 0, poolsSwapped: 0, hookedPoolsSwapped: 0};
    const hooksSwapped = new Set();
    for (const [id, n] of swapsByPool) {
      const pool = pools.get(id);
      if (!pool) throw new Error(`Swap in pool ${id}, which was not initialized in range`);
      sums.swapEvents += n;
      sums.poolsSwapped++;
      if (pool.native) sums.swapEventsNativeEth += n;
      if (pool.hooks === 0n) sums.swapEventsWithoutHooks += n;
      else {
        sums.swapEventsWithHooks += n;
        sums.hookedPoolsSwapped++;
        hooksSwapped.add(pool.hooks);
      }
      if (nameOf.has(pool.hooks)) {
        named[nameOf.get(pool.hooks)].poolsSwapped++;
        named[nameOf.get(pool.hooks)].swapEvents += n;
      }
    }
    return {
      ...result,
      ...sums,
      hooksSwapped: hooksSwapped.size,
      named,
      initializeFingerprintSha256: initialized.fingerprint(),
      swapFingerprintSha256: swaps.fingerprint(),
    };
  },
  async 'uniswap.v4Pool'({chainId, read}) {
    // One pool's key, from its Initialize event in the PoolManager between deployBlock and
    // toBlock, and its Swap events from fromBlock to toBlock.
    const keys = [];
    await scanLogs(chainId, read.address, [TOPIC.v4Initialize, read.poolId], read.deployBlock, read.toBlock, logs => {
      for (const log of logs) {
        const [fee, tickSpacing, hooks] = words(log.data);
        keys.push({
          currency0: asAddress(log.topics[2]),
          currency1: asAddress(log.topics[3]),
          fee: Number(fee),
          tickSpacing: Number(BigInt.asIntN(24, tickSpacing)),
          hooks: asAddress(hooks),
          initializedBlock: Number(BigInt(log.blockNumber)),
        });
      }
    }, read.initializeWindow);
    if (keys.length !== 1) throw new Error(`Pool ${read.poolId} was initialized ${keys.length} times in range`);
    const swaps = new LogSet();
    await scanLogs(chainId, read.address, [TOPIC.v4Swap, read.poolId], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) swaps.add(log);
    }, read.swapWindow);
    return {...keys[0], swapEvents: swaps.size, swapFingerprintSha256: swaps.fingerprint()};
  },
  async 'morpho.market'({chainId, block, read}) {
    // One Morpho Blue market at a block: its parameters and its supplied and borrowed
    // totals as stored (interest is accrued up to lastUpdate).
    const [loanToken, collateralToken, oracle, irm, lltv] = words(await call(chainId, read.address, SEL.morphoIdToMarketParams + read.marketId.slice(2), block));
    const [state] = await morphoMarketStates(chainId, read.address, [read.marketId], block);
    return {
      loanToken: asAddress(loanToken),
      collateralToken: asAddress(collateralToken),
      oracle: asAddress(oracle),
      irm: asAddress(irm),
      lltv: units(lltv, 18),
      totalSupplyAssets: units(state.totalSupplyAssets, read.loanDecimals),
      totalBorrowAssets: units(state.totalBorrowAssets, read.loanDecimals),
      lastUpdate: iso(state.lastUpdate),
      fee: units(state.fee, 18),
    };
  },
  async 'morpho.loanToken'({chainId, block, read}) {
    // Morpho Blue markets created up to `block` and those that lend one token, with their
    // supplied and borrowed totals as stored at `block` (interest accrued up to each
    // market's last update). With fromBlock, also the Borrow events in those markets
    // from fromBlock to `block`.
    const created = new LogSet();
    const markets = await morphoMarkets(chainId, read.address, read.deployBlock, block, created);
    const ids = [...markets].filter(([, market]) => market.loanToken === BigInt(read.loanToken)).map(([id]) => id).sort();
    const states = await morphoMarketStates(chainId, read.address, ids, block);
    const borrowing = states.filter(state => state.totalBorrowAssets > 0n);
    const result = {
      marketsCreated: markets.size,
      loanTokenMarkets: ids.length,
      loanTokenMarketsWithBorrows: borrowing.length,
      totalSupplyAssets: units(states.reduce((sum, state) => sum + state.totalSupplyAssets, 0n), read.loanDecimals),
      totalBorrowAssets: units(states.reduce((sum, state) => sum + state.totalBorrowAssets, 0n), read.loanDecimals),
      createMarketFingerprintSha256: created.fingerprint(),
    };
    if (read.fromBlock === undefined) return result;
    const lending = new Set(ids);
    const borrows = new LogSet();
    let borrowedRaw = 0n;
    await scanLogs(chainId, read.address, [TOPIC.morphoBorrow], read.fromBlock, block, logs => {
      for (const log of logs) {
        if (!lending.has(log.topics[1])) continue;
        borrows.add(log);
        borrowedRaw += words(log.data)[1];
      }
    }, read.window);
    return {...result, borrowEvents: borrows.size, borrowed: units(borrowedRaw, read.loanDecimals), borrowFingerprintSha256: borrows.fingerprint()};
  },
  async 'morpho.marketBorrows'({chainId, read}) {
    // Borrow events in one Morpho Blue market in the block range.
    const set = new LogSet();
    let borrowedRaw = 0n;
    await scanLogs(chainId, read.address, [TOPIC.morphoBorrow, read.marketId], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        set.add(log);
        borrowedRaw += words(log.data)[1];
      }
    }, read.window);
    return {borrowEvents: set.size, borrowed: units(borrowedRaw, read.loanDecimals), logsFingerprintSha256: set.fingerprint()};
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
    const set = new LogSet();
    const topics = [[TOPIC.mint, TOPIC.burn, TOPIC.blacklisted, TOPIC.unBlacklisted]];
    await scanLogs(chainId, read.address, topics, read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        set.add(log);
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
    }, read.window);
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
      logsFingerprintSha256: set.fingerprint(),
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
    const set = new LogSet();
    await scanLogs(chainId, read.address, [TOPIC.seaportOrderFulfilled], read.fromBlock, read.toBlock, logs => {
      for (const log of logs) {
        set.add(log);
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
    }, read.window);
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
      logsFingerprintSha256: set.fingerprint(),
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
  const started = Date.now();
  const result = await READS[entry.read.kind](entry);
  const seconds = `${Math.round((Date.now() - started) / 1000)}s`;
  if (write) {
    entry.result = result;
    console.log(`recorded ${entry.id} (${seconds}) ${JSON.stringify(result)}`);
  } else if (JSON.stringify(result) === JSON.stringify(entry.result)) {
    console.log(`ok       ${entry.id} (${seconds})`);
  } else {
    failures++;
    console.log(`MISMATCH ${entry.id}\n  recorded ${JSON.stringify(entry.result)}\n  now      ${JSON.stringify(result)}`);
  }
}
if (write) {
  // Merge into the file as it is now, so separate --only runs can record side by side.
  const current = JSON.parse(readFileSync(FILE, 'utf8'));
  for (const [key, block] of Object.entries(doc.blocks)) current.blocks[key] ??= block;
  for (const entry of doc.reads) {
    if (only && !only.has(entry.id)) continue;
    const index = current.reads.findIndex(read => read.id === entry.id);
    if (index >= 0) current.reads[index] = entry;
  }
  writeFileSync(FILE, JSON.stringify(current, null, 1) + '\n');
}
process.exit(failures ? 1 : 0);
