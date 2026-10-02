export const EDITION = Object.freeze({id:'2026-10-01',ediCommit:'60c755565f285c379af7e23c20f50adc59eac57d',ediRegistrySha256:'0fb808b38fec6e74b4f42074c109eb7f8d9d4be2f9cec3460c414966b4bd413f',ediRegistryDate:'2026-10-01',editorialRevision:'2026-10-02.1',repository:'https://github.com/ryanberckmans/ethereum-decentralization-index'});
export const utcToday=()=>new Date().toISOString().slice(0,10);

/** @cc [label:product] trustworthy-date-floor
 * A client clock earlier than server evaluation MUST NOT backdate the registry.
 */
export const evaluationDay=(candidate:string,serverDay:string)=>/^\d{4}-\d{2}-\d{2}$/.test(candidate)&&candidate>=serverDay&&!Number.isNaN(Date.parse(candidate))&&new Date(candidate).toISOString().slice(0,10)===candidate?candidate:serverDay;
