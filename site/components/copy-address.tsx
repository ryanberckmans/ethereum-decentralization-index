"use client";
import {useState} from 'react';
import type {UI} from '@/lib/schema';
export function CopyAddress({address,t}:{address:string;t:UI}){const [message,setMessage]=useState('');return <div className="address-row"><code>{address}</code><button className="button quiet" onClick={async()=>{try{await navigator.clipboard.writeText(address);setMessage(t.copied)}catch{setMessage(t.copyFailed)}}}>{t.copyAddress}</button><span className="small" role="status">{message}</span></div>}
