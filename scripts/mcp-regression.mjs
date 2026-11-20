// Prueba E2E del MCP real (JSON-RPC stdio) en Brave aislado y sin modelos remotos.
// No modifica los perfiles ni los exámenes del usuario.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const tmp=mkdtempSync(join(tmpdir(),'examresolve-mcp-'));
const profile=join(tmp,'profile'), output=join(tmp,'output');
const pageFile=join(root,'simulators','index.html');
let proc;
const pending=new Map();
let counter=0, ok=0;
const server=createServer((req,res)=>{
  if(req.url!=='/index.html'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  createReadStream(pageFile).pipe(res);
});
function pass(claim, description){assert.ok(claim,description);console.log('[OK]',description);ok++;}
async function call(method,params={},timeout=45000){
  const id=++counter;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timeout'))},timeout);
    pending.set(id,{resolve,reject,timer});
    proc.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
  });
}
function rpcInit(proc){
  const lines=createInterface({input:proc.stdout});
  lines.on('line',line=>{
    let msg;try{msg=JSON.parse(line)}catch{return;}
    if(msg.id===undefined || !pending.has(msg.id))return;
    const entry=pending.get(msg.id);pending.delete(msg.id);clearTimeout(entry.timer);
    if(msg.error)entry.reject(new Error(JSON.stringify(msg.error)));
    else entry.resolve(msg.result);
  });
}
function listText(result){
  return (result?.content||[]).map(x=>x.type==='text'?x.text:'').join(' ');
}
try{
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve(undefined));
  });
  const address=server.address();
  const port=typeof address==='object' && address ? address.port : 0;
  proc=spawn('bash',['./scripts/playwright-mcp-brave.sh'],{
    cwd:root,
    env:{...process.env,PW_BROWSER_MODE:'background',BRAVE_AGENT_PROFILE:profile,PLAYWRIGHT_OUTPUT_DIR:output,PW_MCP_CONFIG:join(root,'scripts','playwright-mcp.config.json')},
    detached:true,stdio:['pipe','pipe','pipe']
  });
  rpcInit(proc);
  let errors='';
  proc.stderr.on('data',x=>{errors+=x.toString();});
  proc.once('error',e=>{for(const x of pending.values()){clearTimeout(x.timer);x.reject(e)}pending.clear()});
  proc.once('exit',c=>{for(const x of pending.values()){clearTimeout(x.timer);x.reject(new Error('MCP salió ('+c+'): '+errors.slice(-1500)))}pending.clear()});
  const hi=await call('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'examresolve-mcp-regression',version:'1.0.0'}});
  pass(Boolean(hi?.serverInfo),'Playwright MCP negocia protocolo');
  proc.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  const tools=await call('tools/list');
  const names=tools?.tools?.map(x=>x.name)||[];
  pass(names.includes('browser_navigate')&&names.includes('browser_snapshot'),'MCP registra navegar y snapshot');
  const open=await call('tools/call',{name:'browser_navigate',arguments:{url:'http://127.0.0.1:'+port+'/index.html'}});
  pass(!open?.isError && /Simulador técnico/.test(listText(open)), 'MCP navega al simulador local');
  const snap=await call('tools/call',{name:'browser_snapshot',arguments:{}});
  pass(!snap?.isError && /Pregunta 1 de 5/.test(listText(snap)), 'MCP lee la primera pregunta en Brave oculto');
  const dom=await call('tools/call',{name:'browser_evaluate',arguments:{function:'() => document.body.innerText.slice(0, 400)'}});
  pass(!dom?.isError && /Pregunta 1 de 5/.test(listText(dom)), 'MCP puede examinar texto real del DOM');
  const shot=await call('tools/call',{name:'browser_take_screenshot',arguments:{}});
  pass(!shot?.isError && shot?.content?.some(x=>x.type==='image'||/screenshot|\.png/i.test(x.text||'')), 'MCP captura imágenes para el subagente visual');
  console.log('Regresión MCP: '+ok+' OK, 0 fallos');
}catch(e){
  console.error('[FAIL] Regresión MCP:',e.message);
  process.exitCode=1;
}finally{
  for(const x of pending.values()){clearTimeout(x.timer);x.reject(new Error('MCP detenido'))}
  pending.clear();
  if(proc?.pid){
    try{process.kill(-proc.pid,'SIGTERM')}catch{proc.kill('SIGTERM')}
  }
  await new Promise(resolve=>server.close(resolve));
  // La terminación de Brave puede tardar levemente en soltar los archivos.
  await new Promise(r=>setTimeout(r,400));
  rmSync(tmp,{recursive:true,force:true});
}