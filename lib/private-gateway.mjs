import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
const matches=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
export function createGateway({key,upstreamPort=4173}){
 return http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');
  const url=new URL(req.url,'http://gateway');
  if(url.searchParams.has('access')){
   if(!matches(url.searchParams.get('access'),key)){res.writeHead(403,{'Content-Type':'text/plain'});return res.end('Private table. Use the invite your friend sent.');}
   url.searchParams.delete('access');res.setHeader('Set-Cookie',`poker_access=${key}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`);res.writeHead(303,{Location:url.pathname+url.search});return res.end();
  }
  const cookie=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('poker_access='))?.slice('poker_access='.length);
  if(!matches(cookie,key)){res.writeHead(401,{'Content-Type':'text/html'});return res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Private poker table</title><h1>Private poker table</h1><p>Open the complete private invite your friend sent you.</p>');}
  if(req.method==='GET'&&url.pathname==='/api/local'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({multiplayer:true,inviteBase:'https://'+req.headers.host+'/?access='+key,addresses:[]}));}
  const headers={...req.headers};delete headers.cookie;
  const proxy=http.request({hostname:'127.0.0.1',port:upstreamPort,path:req.url,method:req.method,headers},upstream=>{res.writeHead(upstream.statusCode,{...upstream.headers,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'});upstream.pipe(res);});
  proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/plain'});res.end('The host is reconnecting. Please try again shortly.');});req.pipe(proxy);
 });
}
