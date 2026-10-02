"use client";
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
// Native constrained choices keep OS keyboard/touch behavior and avoid loading
// floating-menu machinery for every directory filter and display preference.
export function Choice({label,value,options,onChange}:{label:string;value:string;options:[string,string][];onChange:(v:string)=>void}){return <label className="choice"><span>{label}</span><NativeSelect aria-label={label} className="select-control" value={value} onChange={e=>onChange(e.target.value)}>{options.map(([id,text])=><NativeSelectOption key={id} value={id}>{text}</NativeSelectOption>)}</NativeSelect></label>}
