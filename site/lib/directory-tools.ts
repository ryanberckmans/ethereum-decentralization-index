import {parseFilters,filterQuery,type Filters} from './catalog';
export const configurationSchema={type:'object',additionalProperties:false,properties:{q:{type:'string',maxLength:200},role:{type:'string'},kind:{type:'string'},network:{type:'string'},grade:{type:'string'},floor:{type:'string'},review:{type:'string'},story:{type:'string'},sort:{type:'string'},page:{type:'integer',minimum:1,maximum:100},ids:{type:'array',maxItems:4,uniqueItems:true,items:{type:'string'}}}};
export function decodeConfiguration(input:unknown,current:Filters):Filters{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Expected an object');
 const p=new URLSearchParams(filterQuery(current));
 for(const [key,value] of Object.entries(input)){
  if(!(Object.hasOwn(configurationSchema.properties,key)))throw new TypeError('Unknown directory field: '+key);
  if(key==='ids'){
   if(!Array.isArray(value)||value.length>4||value.some(id=>typeof id!=='string')||new Set(value).size!==value.length)throw new TypeError('Expected up to four distinct object IDs');
   p.set(key,value.join(','));
  }else if(key==='page'){
   if(!Number.isInteger(value)||Number(value)<1||Number(value)>100)throw new TypeError('Invalid page');
   p.set(key,String(value));
  }else{
   if(typeof value!=='string'||value.length>200)throw new TypeError('Invalid directory value');
   p.set(key,value);
  }
 }
 if(!Object.hasOwn(input,'page')&&Object.keys(input).some(key=>key!=='ids'))p.set('page','1');
 const result=parseFilters(p);
 for(const [key,value] of Object.entries(input))if(JSON.stringify(result[key as keyof Filters])!==JSON.stringify(value))throw new TypeError('Unsupported value for '+key);
 return result;
}
