import type {Relationship} from './schema';
// Contextual subjects are deliberately outside the EDI namespace. They have no
// inferred assessment. An illustrative hook is not a verified live deployment.
export const contextualSubjects=[
 {id:'context:applications-v2',name:'Applications using Uniswap v2',kind:'illustration',storyIds:['uniswap-cores']},
 {id:'context:coinbase-borrowing',name:'Coinbase borrowing',kind:'interface',storyIds:['morpho-distribution']},
 {id:'context:morpho-base',name:'Morpho on Base',kind:'deployment',storyIds:['morpho-distribution']},
 {id:'context:weth-offers',name:'OpenSea WETH offers',kind:'interface',storyIds:['weth-shared-infrastructure']},
 {id:'context:visa-pilot',name:'Visa USDC settlement pilot (2021)',kind:'integration',storyIds:['dollars-on-ethereum']},
 {id:'context:eligible-investor',name:'Eligible investor',kind:'illustration',storyIds:['fund-shares-liquidity']},
 {id:'context:uniswapx',name:'UniswapX',kind:'interface',storyIds:['fund-shares-liquidity']},
 {id:'context:approved-counterparty',name:'Approved counterparty',kind:'illustration',storyIds:['fund-shares-liquidity']},
 {id:'context:access-rules',name:'Issuer access rules',kind:'illustration',storyIds:['open-cores-controlled-markets']},
 {id:'context:permissioned-hook',name:'Pool-specific permissioned hook',kind:'illustration',storyIds:['open-cores-controlled-markets']},
];
/**
 * @cc [label:product] editorial-edges-are-not-control-edges
 * These evidenced relationships MUST NOT enter EDI assessment composition.
 * Only the canonical registry supplies control-dependency edges.
 */
export const relationships:Relationship[]=[
 {id:'v2-applications',from:'context:applications-v2',to:'uniswap-v2',type:'integrates-with',state:'reported-adoption',claimIds:['uniswap-2020'],storyIds:['uniswap-cores'],chainIds:[1]},
 {id:'v2-ethereum',from:'uniswap-v2',to:'ethereum',type:'settles-on',state:'reported-adoption',claimIds:['uniswap-2020'],storyIds:['uniswap-cores'],chainIds:[1]},
 {id:'coinbase-morpho-base',from:'context:coinbase-borrowing',to:'context:morpho-base',type:'interface-to',state:'reported-adoption',claimIds:['coinbase-2026'],storyIds:['morpho-distribution'],chainIds:[8453]},
 {id:'base-ethereum',from:'base',to:'ethereum',type:'settles-on',state:'capability',claimIds:['edi-base'],storyIds:['morpho-distribution'],chainIds:[8453,1]},
 {id:'eth-weth9',from:'native-eth',to:'weth9',type:'collateral-for',state:'capability',claimIds:['edi-weth9'],storyIds:['weth-shared-infrastructure'],chainIds:[1]},
 {id:'weth-offers-seaport',from:'context:weth-offers',to:'seaport-v1.6',type:'integrates-with',state:'capability',claimIds:['opensea-offers','opensea-seaport'],storyIds:['weth-shared-infrastructure'],chainIds:[1]},
 {id:'usdc-visa',from:'usdc',to:'context:visa-pilot',type:'integrates-with',state:'pilot',claimIds:['visa-2021'],storyIds:['dollars-on-ethereum'],chainIds:[1]},
 {id:'visa-ethereum',from:'context:visa-pilot',to:'ethereum',type:'settles-on',state:'pilot',claimIds:['visa-2021'],storyIds:['dollars-on-ethereum'],chainIds:[1]},
 {id:'investor-uniswapx',from:'context:eligible-investor',to:'context:uniswapx',type:'interface-to',state:'announced',claimIds:['buidl-uniswapx'],storyIds:['fund-shares-liquidity']},
 {id:'counterparty-buidl',from:'context:approved-counterparty',to:'buidl',type:'integrates-with',state:'announced',claimIds:['buidl-uniswapx'],storyIds:['fund-shares-liquidity']},
 {id:'access-rules-hook',from:'context:access-rules',to:'context:permissioned-hook',type:'integrates-with',state:'capability',claimIds:['permissioned-pools'],storyIds:['open-cores-controlled-markets'],chainIds:[1]},
 {id:'hook-v4',from:'context:permissioned-hook',to:'uniswap-v4',type:'integrates-with',state:'capability',claimIds:['permissioned-pools'],storyIds:['open-cores-controlled-markets'],chainIds:[1]},
];
