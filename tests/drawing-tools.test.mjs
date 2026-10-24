import test from 'node:test';
import assert from 'node:assert/strict';
import {DRAWING_TOOLS,ANCHOR_COUNTS,toolDefinition,drawingPrimitives,screenLine,hitDrawing} from '../src/drawing-tools.mjs';
import {DrawingDocument,validateDocument} from '../src/drawing-document.mjs';
import {viewport} from '../src/geometry.mjs';
const bounds={width:1000,height:500};
const v=viewport({width:1000,height:500,fromTime:0,toTime:100,minPrice:0,maxPrice:100});
const anchors=[{time:25,price:75},{time:55,price:45},{time:80,price:70}];
const blank=()=>({schema:1,ownerId:'local-research-only',workspaceId:'W',symbol:'SYNTH',timeframe:'1h',drawings:[]});
test('every advertised drawing has explicit arity and finite rendered geometry',()=>{
 assert.equal(DRAWING_TOOLS.length,19);assert.equal(new Set(DRAWING_TOOLS.map(x=>x.id)).size,19);
 for(const d of DRAWING_TOOLS){assert.equal(ANCHOR_COUNTS[d.id],d.anchors);assert.equal(toolDefinition(d.id).group,d.group);
  const drawing={id:'x',type:d.id,anchors:anchors.slice(0,d.anchors)};
  const primitives=drawingPrimitives(drawing,v,bounds);assert.ok(primitives.length,d.id+': no geometry');
  for(const p of primitives)for(const x of ['a','b','at'])if(p[x])assert.ok(Number.isFinite(p[x].x)&&Number.isFinite(p[x].y),d.id+': bad '+x);
 }
});
test('document accepts all supported types and rejects forged ones',()=>{
 const d=new DrawingDocument(blank());for(const t of DRAWING_TOOLS)d.upsert({id:t.id,type:t.id,anchors:anchors.slice(0,t.anchors)});
 assert.equal(DrawingDocument.parse(d.serialize(),'local-research-only').snapshot().drawings.length,19);
 assert.throws(()=>DrawingDocument.parse(d.serialize(),'other'),/owner mismatch/);
 assert.throws(()=>validateDocument({...blank(),drawings:[{id:'x',type:'__proto__',anchors:[anchors[0]]}]}));
 assert.throws(()=>validateDocument({...blank(),drawings:[{id:'x',type:'trendline',anchors:[anchors[0]]}]}));
 assert.throws(()=>validateDocument({...blank(),drawings:[{id:'x',type:'text',anchors:[anchors[0]],locked:'yes'}]}));
});
test('undo redo and last object deletion maintain empty-document semantics',()=>{
 const d=new DrawingDocument(blank());d.upsert({id:'a',type:'triangle',anchors});d.remove('a');
 assert.equal(d.snapshot().drawings.length,0);assert.ok(d.undo());assert.equal(d.snapshot().drawings.length,1);
 assert.ok(d.redo());assert.equal(d.snapshot().drawings.length,0);
 d.replaceDrawings([{id:'b',type:'text',anchors:[anchors[0]],hidden:true}]);assert.equal(d.snapshot().drawings[0].hidden,true);assert.ok(d.undo());assert.equal(d.snapshot().drawings.length,0);
});
test('ray and extended-line clip to chart boundaries',()=>{
 const a={x:25,y:50},b={x:75,y:50};
 assert.deepEqual(screenLine(a,b,'end',{width:100,height:100}),[a,{x:100,y:50}]);
 assert.deepEqual(screenLine(a,b,'both',{width:100,height:100}),[{x:0,y:50},{x:100,y:50}]);
 assert.deepEqual(screenLine({x:-50,y:200},{x:150,y:200},'both',{width:100,height:100}),null);
});
test('fibonacci mapping respects exact ratios',()=>{
 const p=drawingPrimitives({type:'fibonacci',anchors:[anchors[0],anchors[1]]},v,bounds);
 assert.deepEqual(p.filter(x=>x.kind==='text').map(x=>x.value),['0','0.24','0.38','0.5','0.62','0.79','1']);
 assert.equal(p[0].a.y,125);assert.equal(p.at(-2).a.y,275);
});
test('hit testing selects geometry including lines, shapes and labels',()=>{
 const draw=(type,pts)=>({type,anchors:pts});
 assert.equal(hitDrawing(draw('trendline',anchors.slice(0,2)),{x:400,y:200},v,bounds),true);
 assert.equal(hitDrawing(draw('rectangle',anchors.slice(0,2)),{x:400,y:125},v,bounds),true);
 assert.equal(hitDrawing(draw('text',[anchors[0]]),{x:255,y:125},v,bounds),true);
 assert.equal(hitDrawing(draw('trendline',anchors.slice(0,2)),{x:900,y:400},v,bounds),false);
});
test('invalid geometry is rejected',()=>{
 assert.throws(()=>drawingPrimitives({type:'garbage',anchors:anchors.slice(0,2)},v,bounds));
 assert.throws(()=>drawingPrimitives({type:'trendline',anchors:[anchors[0]]},v,bounds));
});
