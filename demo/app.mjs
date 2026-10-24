import {DrawingDocument} from '../src/drawing-document.mjs';
import {viewport,nearestOhlc} from '../src/geometry.mjs';
import {DRAWING_TOOLS,drawingPrimitives,primitiveSegments,hitDrawing} from '../src/drawing-tools.mjs';
const canvas=document.querySelector('#chart'),ctx=canvas.getContext('2d');
const toolsEl=document.querySelector('#tools'),statusEl=document.querySelector('#status'),help=document.querySelector('#help');
const DOC_KEY='wavealpha-drawing-lab-v1';
const fresh=()=>({schema:1,ownerId:'local-research-only',workspaceId:'drawing-lab',symbol:'SYNTH',timeframe:'1h',drawings:[]});
let documentModel=new DrawingDocument(fresh());
let tool='select',selected=null,preview=null,start=null,gesture=null,stage=[],dims={width:1,height:1};
let pan=0,priceOffset=0,scale=1,pointer=null,idCounter=0,db=null;
const candles=Array.from({length:180},(_,i)=>{
 const mid=100+Math.sin(i/11)*8+Math.cos(i/23)*13+i*.09;
 const open=mid+Math.sin(i*3)*2,close=mid+Math.sin(i*2.3)*2;
 return {time:i,open,close,high:Math.max(open,close)+1.4+(i%4)*.4,low:Math.min(open,close)-1.6-(i%3)*.3};
});
function transform(){
 const w=dims.width-75,h=dims.height-28,from=20+pan,to=180+pan;
 return viewport({width:w,height:h,fromTime:from,toTime:to,minPrice:65+priceOffset-(scale-1)*25,maxPrice:155+priceOffset+(scale-1)*25});
}
function anchorAt(p,{snap=true}={}){
 const v=transform(),q=v.toAnchor(p);
 if(!snap)return q;
 const nearest=nearestOhlc(p,candles.filter(bar=>Math.abs(bar.time-q.time)<2),v,10);
 return nearest?{time:nearest.time,price:nearest.price}:q;
}
function setStatus(msg){statusEl.textContent=msg;}
function openDB(){return new Promise((resolve,reject)=>{
 if(!('indexedDB' in window)){reject(Error('IndexedDB unavailable'));return;}
 const request=indexedDB.open('wa-drawing-lab',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('documents');
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error);
});}
function dbOperation(mode,fn){return new Promise((resolve,reject)=>{
 const tx=db.transaction('documents',mode),store=tx.objectStore('documents');
 let value;
 try{const req=fn(store);if(req)req.onsuccess=()=>{value=req.result;};}catch(e){reject(e);return;}
 tx.oncomplete=()=>resolve(value);
 tx.onerror=()=>reject(tx.error);
 tx.onabort=()=>reject(tx.error||Error('transaction aborted'));
});}
let pending=null,writing=false;
function persist(){pending=documentModel.serialize();void drain();}
async function drain(){if(writing||!db)return;writing=true;
 try{while(pending!==null){const payload=pending;pending=null;await dbOperation('readwrite',store=>store.put(payload,DOC_KEY));}setStatus('Saved locally · IndexedDB');}
 catch(e){if(pending===null)pending=documentModel.serialize();setStatus('SAVE FAILED · Export a backup: '+e.message);}
 finally{writing=false;}
}
function commitDrawing(value){if(documentModel.upsert(value)){persist();render();}}
function deleteSelected(){const d=documentModel.snapshot().drawings.find(x=>x.id===selected);if(d?.locked)return;if(selected&&documentModel.remove(selected)){selected=null;persist();render();}}
function undo(){if(documentModel.undo()){selected=null;persist();render();}}
function redo(){if(documentModel.redo()){selected=null;persist();render();}}
const colors={line:'#8fc1eb',selected:'#f6b95e',grid:'#2e4555'};
function drawPrimitive(primitive,chosen=false){
 ctx.strokeStyle=chosen?colors.selected:colors.line;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=chosen?2:1.4;ctx.setLineDash(primitive.dash?[5,4]:[]);
 if(primitive.kind==='text'||primitive.kind==='callout'){
  ctx.font='12px system-ui';ctx.textAlign='left';const label=String(primitive.value).slice(0,180);
  if(primitive.kind==='callout'){
   const length=Math.max(54,ctx.measureText(label).width+14);ctx.fillStyle='#243f53';
   ctx.fillRect(primitive.at.x,primitive.at.y-18,length,22);ctx.strokeRect(primitive.at.x,primitive.at.y-18,length,22);ctx.fillStyle='#e9f3ff';
  }
  ctx.fillText(label,primitive.at.x+3,primitive.at.y-3);return;
 }
 for(const [a,b] of primitiveSegments(primitive,dims)){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 if(primitive.arrow){
  const {a,b}=primitive,t=Math.atan2(b.y-a.y,b.x-a.x);
  ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-12*Math.cos(t-.45),b.y-12*Math.sin(t-.45));
  ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-12*Math.cos(t+.45),b.y-12*Math.sin(t+.45));ctx.stroke();
 }
 ctx.setLineDash([]);
}
function render(){
 const dpr=window.devicePixelRatio||1;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,dims.width,dims.height);
 ctx.fillStyle='#101c27';ctx.fillRect(0,0,dims.width,dims.height);
 const v=transform(),plotW=dims.width-75,plotH=dims.height-28;
 ctx.strokeStyle=colors.grid;ctx.lineWidth=.7;ctx.font='11px system-ui';ctx.fillStyle='#aabfcf';
 for(let k=0;k<=6;k++){
  const y=plotH*k/6;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(plotW,y);ctx.stroke();
  ctx.fillText(v.toAnchor({x:0,y}).price.toFixed(2),plotW+7,y+3);
 }
 ctx.save();ctx.beginPath();ctx.rect(0,0,plotW,plotH);ctx.clip();
 for(const bar of candles){
  const q=v.toScreen({time:bar.time,price:bar.close});if(q.x<-8||q.x>plotW+8)continue;
  const high=v.toScreen({time:bar.time,price:bar.high}).y,low=v.toScreen({time:bar.time,price:bar.low}).y;
  const o=v.toScreen({time:bar.time,price:bar.open}).y;
  ctx.fillStyle=bar.close>=bar.open?'#48bfa7':'#eb6f83';ctx.strokeStyle=ctx.fillStyle;
  ctx.beginPath();ctx.moveTo(q.x,high);ctx.lineTo(q.x,low);ctx.stroke();
  ctx.fillRect(q.x-2.5,Math.min(o,q.y),5,Math.max(1,Math.abs(o-q.y)));
 }
 for(const d of documentModel.snapshot().drawings.filter(x=>!x.hidden))
  for(const p of drawingPrimitives(d,v,dims))drawPrimitive(p,d.id===selected);
 if(preview)for(const p of drawingPrimitives(preview,v,dims))drawPrimitive(p,true);
 const picked=documentModel.snapshot().drawings.find(d=>d.id===selected);
 if(picked&&!picked.hidden)for(const a of picked.anchors){
  const p=v.toScreen(a);ctx.fillStyle=colors.selected;ctx.fillRect(p.x-4,p.y-4,8,8);
 }
 if(pointer){
  ctx.strokeStyle='#7892a5';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(pointer.x,0);ctx.lineTo(pointer.x,plotH);
  ctx.moveTo(0,pointer.y);ctx.lineTo(plotW,pointer.y);ctx.stroke();ctx.setLineDash([]);
 }
 ctx.restore();ctx.fillStyle='#9fb4c5';ctx.fillText('Synthetic data · no live market feed',12,dims.height-8);
}
function fit(){
 const rect=canvas.getBoundingClientRect();dims={width:Math.max(160,rect.width),height:Math.max(180,rect.height)};
 const dpr=window.devicePixelRatio||1;canvas.width=Math.round(dims.width*dpr);canvas.height=Math.round(dims.height*dpr);render();
}
function localPoint(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function newId(){idCounter++;return 'local-'+Date.now().toString(36)+'-'+idCounter;}
function toolset(id){
 tool=id;preview=null;start=null;gesture=null;stage=[];
 for(const b of toolsEl.querySelectorAll('button[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===id));
 help.textContent=id==='select'?'Drag drawing or handles to edit · wheel zoom · Shift + wheel pan':
 (DRAWING_TOOLS.find(x=>x.id===id)?.anchors===3?'Click three anchor positions':'Drag between two points (single-point tools: click)');
 render();
}
function onDown(e){
 if(e.button!==0)return;const q=localPoint(e),v=transform();canvas.setPointerCapture(e.pointerId);start=q;pointer=q;
 if(tool==='select'){
  const drawings=documentModel.snapshot().drawings;
  for(let i=drawings.length-1;i>=0;i--){
   const d=drawings[i];
   if(!d.hidden&&hitDrawing(d,q,v,dims)){
    selected=d.id;const handle=d.anchors.findIndex(a=>{const p=v.toScreen(a);return Math.hypot(p.x-q.x,p.y-q.y)<10;});
    gesture=d.locked?null:{drawing:d,handle,at:q};render();return;
   }
  }
  selected=null;render();return;
 }
 const meta=DRAWING_TOOLS.find(x=>x.id===tool);
 if(meta.anchors===1){
  const d={id:newId(),type:tool,anchors:[anchorAt(q)],text:tool==='text'?'Text':tool==='callout'?'Note':undefined};
  commitDrawing(d);start=null;
 }else if(meta.anchors===3){
  stage.push(anchorAt(q));
  if(stage.length===3){commitDrawing({id:newId(),type:tool,anchors:stage});stage=[];preview=null;}
  else setStatus('Anchor '+stage.length+'/3 · choose next point');
  start=null;
 }
}
function onMove(e){
 pointer=localPoint(e);if(!start){render();return;}
 const q=pointer;
 if(tool==='select'&&gesture){
  const d=structuredClone(gesture.drawing),v=transform(),delta={x:q.x-gesture.at.x,y:q.y-gesture.at.y};
  if(gesture.handle>=0)d.anchors[gesture.handle]=anchorAt(q,{snap:false});
  else d.anchors=d.anchors.map(a=>{const p=v.toScreen(a);return v.toAnchor({x:p.x+delta.x,y:p.y+delta.y});});
  preview=d;
 }else if(tool!=='select'){
  const meta=DRAWING_TOOLS.find(x=>x.id===tool);
  if(meta.anchors===2)preview={id:'preview',type:tool,anchors:[anchorAt(start),anchorAt(q)]};
 }
 render();
}
function onUp(e){
 if(start&&preview){
  if(tool==='select'){if(gesture)commitDrawing(preview);}
  else if(DRAWING_TOOLS.find(x=>x.id===tool)?.anchors===2)commitDrawing({...preview,id:newId()});
 }
 start=null;gesture=null;preview=null;render();
}
for(const group of [...new Set(DRAWING_TOOLS.map(x=>x.group))]){
 const h=document.createElement('h3');h.textContent=group;toolsEl.append(h);
 for(const entry of DRAWING_TOOLS.filter(x=>x.group===group)){
  const b=document.createElement('button');b.textContent=entry.label;b.dataset.tool=entry.id;
  b.setAttribute('aria-pressed','false');b.onclick=()=>toolset(entry.id);toolsEl.append(b);
 }
}
toolsEl.querySelector('[data-tool=select]').onclick=()=>toolset('select');
canvas.addEventListener('pointerdown',onDown);
canvas.addEventListener('pointermove',onMove);
canvas.addEventListener('pointerup',onUp);
canvas.addEventListener('pointercancel',()=>{start=null;gesture=null;preview=null;render();});
canvas.addEventListener('pointerleave',()=>{pointer=null;render();});
canvas.addEventListener('wheel',e=>{
 e.preventDefault();if(e.shiftKey)pan+=Math.sign(e.deltaY)*5;
 else scale=Math.max(.3,Math.min(5,scale*(e.deltaY>0?1.12:.89)));render();
},{passive:false});
document.querySelector('#delete').onclick=deleteSelected;
document.querySelector('#lock').onclick=()=>{
 const d=documentModel.snapshot().drawings.find(x=>x.id===selected);if(d)commitDrawing({...d,locked:!d.locked});
};
document.querySelector('#hide').onclick=()=>{
 const ds=documentModel.snapshot().drawings;if(!ds.length)return;
 const hide=ds.some(d=>!d.hidden);
 if(documentModel.replaceDrawings(ds.map(d=>({...d,hidden:hide})))){selected=null;persist();render();}
};
canvas.addEventListener('dblclick',()=>{
 const d=documentModel.snapshot().drawings.find(x=>x.id===selected);
 if(d&&!d.locked&&(d.type==='text'||d.type==='callout')){
  const value=prompt('Annotation text (up to 1000 characters)',d.text||'');
  if(value!==null)commitDrawing({...d,text:value.slice(0,1000)});
 }
});
document.querySelector('#undo').onclick=undo;document.querySelector('#redo').onclick=redo;
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
 if(e.key==='Delete'||e.key==='Backspace')deleteSelected();
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){
  e.preventDefault();if(e.shiftKey)redo();else undo();
 }
});
document.querySelector('#export').onclick=()=>{
 const blob=new Blob([documentModel.serialize()],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='wavealpha-drawings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.querySelector('#import').onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{
  if(f.size>2e6)throw Error('File exceeds 2 MB');
  const next=DrawingDocument.parse(await f.text(),'local-research-only');
  if(next.snapshot().workspaceId!=='drawing-lab'||next.snapshot().symbol!=='SYNTH')throw Error('Document context mismatch');
  documentModel=next;selected=null;persist();render();
 }catch(err){setStatus('Import rejected: '+err.message);}finally{e.target.value='';}
};
async function init(){
 fit();new ResizeObserver(fit).observe(canvas);
 try{
  db=await openDB();const saved=await dbOperation('readonly',store=>store.get(DOC_KEY));
  if(saved)documentModel=DrawingDocument.parse(saved,'local-research-only');
  setStatus(saved?'Recovered local IndexedDB drawing document':'New synthetic local document');render();
 }catch(e){setStatus('No durable storage: '+e.message+' · export manually');}
}
init();
