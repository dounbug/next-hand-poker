import {readFile,writeFile} from 'node:fs/promises';import {randomBytes} from 'node:crypto';import {createGateway} from './lib/private-gateway.mjs';
const path=new URL('./.local-private/internet-key.json',import.meta.url);let key;
try{key=JSON.parse(await readFile(path,'utf8')).key;}catch(e){if(e.code!=='ENOENT')throw e;key=randomBytes(24).toString('hex');await writeFile(path,JSON.stringify({key}),{mode:0o600});}
createGateway({key}).listen(4174,'127.0.0.1',()=>console.log('Private invitation gateway ready on loopback port 4174.'));
