/** Publication configuration is an HTTPS origin, never arbitrary markup or a path. */
export function siteOrigin(){
 const input=process.env.SITE_URL;if(!input)return null;
 const url=new URL(input);
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('SITE_URL must be an HTTPS origin');
 return url.origin;
}
