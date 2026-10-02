"use client";
import {useEffect,useState} from 'react';
import {registryAssessment,reviewTiming,findReview} from '@/vendor/edi/dist/registry/index.js';
import {displayedLevel} from '@/vendor/edi/dist/core/index.js';
import {Badge} from './badge';
import {utcToday,evaluationDay} from '@/lib/edition';
import type {Locale,UI} from '@/lib/schema';
import {date} from '@/lib/format';
export function LiveAssessment({id,asOf,t,locale,scope='mechanism'}:{id:string;asOf:string;t:UI;locale:Locale;scope?:'mechanism'|'position'}){
 const [day,setDay]=useState(asOf);
 useEffect(()=>{const update=()=>setDay(evaluationDay(utcToday(),asOf));update();document.addEventListener('visibilitychange',update);window.addEventListener('pageshow',update);const timer=setInterval(update,60000);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);window.removeEventListener('pageshow',update)}},[]);
 const a=registryAssessment(id,day,{scope});const e=findReview(id)!;const timing=reviewTiming(e,day);const lev=displayedLevel(a);const reviewed=scope==='position'?(e.positionReview?.reviewedAt||(a.status==='assessed'?e.reviewedAt:undefined)):e.reviewedAt;
 if(scope==='position'&&!e.positionReview)return <div className="assessment-block"><strong>{t.position}</strong><p>{t.noPosition}</p><p>{t.positionLimit}</p></div>;
 return <div className="assessment-block"><div className="assessment-line"><Badge assessment={a} t={t} large/><div><strong>{scope==='mechanism'?t.mechanism:t.position}</strong><span>{scope==='mechanism'?(timing.permanent?t.permanent:timing.overdue?t.overdue:a.status==='assessed'?t.complete:a.status==='partial'?t.partial:t.unknown):a.status==='assessed'?t.complete:t.noPosition}</span></div></div><p>{lev===null?t.ediUnknown:(a.status==='assessed'?'':t.atLeast+' D'+lev+'. ')+t['ediTierDef_'+lev]}</p><p className="small muted">{t.evaluated} {date(day,locale)} · {t.researchDate} {reviewed?date(reviewed,locale):t.unknown}</p></div>;
}
