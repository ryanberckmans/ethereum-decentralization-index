import {catalog} from './catalog';
import {EDITION,utcToday} from './edition';
import {observations,claims} from './evidence';
import {relationships,contextualSubjects} from './relationships';
import english from '@/content/en.json';
import type {Profile} from './schema';
/**
 * @cc [label:security] inert-versioned-exports
 * Exports carry scope, provenance and evaluation dates. CSV text beginning with
 * spreadsheet formula syntax MUST be neutralized. App source is never exported.
 */
export function directoryExport(asOf=utcToday()){
 return {schemaVersion:1,edition:EDITION,evaluatedAt:asOf,objects:catalog(english.profiles as Profile[],asOf).map(r=>({id:r.id,name:r.name,kind:r.kind,role:r.role,scope:r.scope,mechanism:r.assessment,position:{assessment:r.position,coverage:r.positionReview?"separate-canonical-review":"no-separate-position-review",review:r.positionReview},researchReviewedAt:r.reviewedAt,reviewTiming:r.timing,addresses:r.addresses,networks:r.networks,dependencies:r.dependencies,sources:r.evidenceUrls,editorial:r.profile?{summary:r.profile.summary,reviewedAt:'2026-10-02',storyIds:r.profile.storyIds}:null}))};
}
export function csvCell(value:unknown){let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function directoryCSV(asOf=utcToday()){
 const header=['id','name','kind','scope','mechanism_status','mechanism_D','known_floor','canonical_position_projection_status','position_coverage','position_reviewed_at','research_reviewed_at','evaluated_at','edi_commit'];
 const rows=directoryExport(asOf).objects.map(o=>[o.id,o.name,o.kind,o.scope,o.mechanism.status,o.mechanism.effectiveLevel,o.mechanism.knownFloor,o.position.assessment.status,o.position.coverage,o.position.review?.reviewedAt,o.researchReviewedAt,asOf,EDITION.ediCommit]);
 return [header,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
export const observationsExport=()=>({schemaVersion:1,edition:EDITION,observations,claims,relationships,contextualSubjects:contextualSubjects.map(s=>({...s,ediCoverage:null})),editorialReviewedAt:'2026-10-02'});
