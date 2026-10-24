// Reproducible static analysis using the official morluto/rea CLI.
// Never commit proprietary Evidence output.
import {spawnSync} from 'node:child_process';
import {openSync,closeSync,existsSync,statSync} from 'node:fs';
import {resolve,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const [input,output]=process.argv.slice(2);
if(!input||!output||!isAbsolute(input)||!isAbsolute(output)){
 console.error('Usage: node tools/rea-static-evidence.mjs /absolute/app.asar /absolute/evidence.json');process.exit(2);
}
if(!input.endsWith('.asar')||!existsSync(input)||!statSync(input).isFile())throw Error('Expected an existing app.asar');
if(existsSync(output))throw Error('Refusing to overwrite Evidence');
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
if(resolve(output).startsWith(root+sep))throw Error('Evidence output must remain outside public repository');
const [major,minor,patch]=process.versions.node.split('.').map(Number);
if(!((major===22&&(minor>23||(minor===23&&patch>=4)))||(major===24&&(minor>22||(minor===22&&patch>=1)))||(major===26&&(minor>12||(minor===12&&patch>=1)))||(major>26)))throw Error('Node version does not satisfy REA 6.7 engines');
const fd=openSync(resolve(output),'wx',0o600);
try{
 const r=spawnSync('rea',['analyze-javascript-application',resolve(input),'--json'],{stdio:['ignore',fd,'inherit'],shell:false,timeout:120000});
 if(r.error)throw r.error;if(r.status!==0)throw Error('REA failed with exit '+r.status);
 console.log('REA finished; independently review the Evidence limitations.');
}finally{closeSync(fd);}
