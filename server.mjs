import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {networkInterfaces} from 'node:os';
import {Rooms} from './lib/rooms.mjs';
const root=new URL('./dist/',import.meta.url),storeDir=process.env.POKER_DATA_DIR?pathToFileURL(resolve(process.env.POKER_DATA_DIR)+'/'):new URL('./.local-private/',import.meta.url),storeFile=new URL('rooms.json',storeDir);
const port=Number(process.env.PORT||4173);let saved=[];
try{saved=JSON.parse(await readFile(storeFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('Local room save could not be read. Preserve .local-private/rooms.json before repairing it.');}
await mkdir(storeDir,{recursive:true,mode:0o700});let writing=Promise.resolve();
function persist(){const body=JSON.stringify(rooms.export());writing=writing.then(async()=>{const tmp=new URL('rooms.tmp',storeDir);await writeFile(tmp,body,{mode:0o600});await rename(tmp,storeFile);}).catch(e=>console.error('Room save failed:',e.message));}
const rooms=new Rooms({saved,onChange:persist});
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
 if(pathname.startsWith('/api/')){
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Open the game on this server to play.'});
  if(req.method==='GET'&&pathname==='/api/local'){let inviteBase;try{inviteBase=JSON.parse(await readFile(new URL('remote-invite.json',storeDir),'utf8')).url;}catch{}return json(res,200,{multiplayer:true,inviteBase,addresses:Object.values(networkInterfaces()).flat().filter(a=>a&&a.family==='IPv4'&&!a.internal).map(a=>`http://${a.address}:${server.address().port}`)});}
  let input={};if(req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return json(res,413,{error:'Request too large.'});}try{input=JSON.parse(body||'{}');}catch{return json(res,400,{error:'Invalid request.'});}}
  if(req.method==='POST'&&pathname==='/api/rooms')return json(res,201,rooms.create(input.name));
  const match=pathname.match(/^\/api\/rooms\/([a-f0-9]{12})(?:\/(join|action))?$/);if(!match)return json(res,404,{error:'Not found.'});
  const [,id,operation]=match,token=req.headers.authorization?.replace(/^Bearer /,'');
  if(req.method==='POST'&&operation==='join')return json(res,200,rooms.join(id,input.name));
  if(req.method==='POST'&&operation==='action')return json(res,200,rooms.action(id,token,input));
  if(req.method==='GET'&&!operation)return json(res,200,rooms.view(id,token));
  return json(res,405,{error:'Method not supported.'});
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 const path=pathname==='/'?'/local.html':pathname==='/solo'?'/index.html':pathname;
 const file=new URL('.'+path,root);if(!file.href.startsWith(root.href))throw Error('Invalid path');
 const body=await readFile(fileURLToPath(file));res.writeHead(200,{'Content-Type':file.pathname.endsWith('.js')?'text/javascript':file.pathname.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch(e){if(req.url.startsWith('/api/'))json(res,400,{error:e.message});else{res.writeHead(404);res.end('Not found');}}});
const interval=setInterval(()=>rooms.tick(),850);
server.listen(port,'0.0.0.0',()=>{const boundPort=server.address().port;console.log(`Local poker: http://localhost:${boundPort}`);for(const addresses of Object.values(networkInterfaces()))for(const a of addresses||[])if(a.family==='IPv4'&&!a.internal)console.log(`Network address: http://${a.address}:${boundPort}`);});
async function close(){clearInterval(interval);persist();await writing;server.close(()=>process.exit(0));}
process.on('SIGINT',close);process.on('SIGTERM',close);
