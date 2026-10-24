// Independently implemented WaveAlpha research geometries. No vendor source.
const DATA=[
['trendline','Trend Line','Lines',2],['ray','Ray','Lines',2],['extended-line','Extended Line','Lines',2],
['horizontal','Horizontal Line','Lines',1],['vertical','Vertical Line','Lines',1],
['cross-line','Cross Line','Lines',1],['arrow','Arrow','Lines',2],
['parallel-channel','Parallel Channel','Channels',3],['pitchfork','Pitchfork','Channels',3],
['rectangle','Rectangle','Shapes',2],['ellipse','Ellipse','Shapes',2],['triangle','Triangle','Shapes',3],
['text','Text','Annotations',1],['callout','Callout','Annotations',1],['measure','Price / Time Measure','Annotations',2],
['fibonacci','Fib Retracement','Fibonacci',2],['fib-extension','Fib Extension','Fibonacci',3],
['fib-timezone','Fib Time Zones','Fibonacci',2],['fib-fan','Fib Fan','Fibonacci',2]];
export const DRAWING_TOOLS=Object.freeze(DATA.map(([id,label,group,anchors])=>Object.freeze({id,label,group,anchors})));
export const ANCHOR_COUNTS=Object.freeze(Object.fromEntries(DRAWING_TOOLS.map(d=>[d.id,d.anchors])));
const types=new Map(DRAWING_TOOLS.map(d=>[d.id,d]));
export const toolDefinition=type=>types.get(type)??null;
const line=(a,b,extra={})=>({kind:'line',a,b,...extra});
const text=(at,value)=>({kind:'text',at,value:String(value).slice(0,1000)});
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const fmt=n=>Number(n.toFixed(2)).toString();
const FIN=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function drawingPrimitives(drawing,transform,bounds){
 const def=toolDefinition(drawing?.type);
 if(!def||!Array.isArray(drawing.anchors)||drawing.anchors.length!==def.anchors||!bounds||!(bounds.width>0&&bounds.height>0))throw TypeError('invalid drawing geometry');
 const p=drawing.anchors.map(a=>transform.toScreen(a));
 if(!p.every(FIN))throw TypeError('nonfinite projected anchor');
 const [a,b,c]=p,w=bounds.width,h=bounds.height;
 switch(drawing.type){
 case 'trendline':return [line(a,b)];
 case 'ray':return [line(a,b,{extend:'end'})];
 case 'extended-line':return [line(a,b,{extend:'both'})];
 case 'horizontal':return [line({x:0,y:a.y},{x:w,y:a.y})];
 case 'vertical':return [line({x:a.x,y:0},{x:a.x,y:h})];
 case 'cross-line':return [line({x:0,y:a.y},{x:w,y:a.y}),line({x:a.x,y:0},{x:a.x,y:h})];
 case 'arrow':return [line(a,b,{arrow:true})];
 case 'parallel-channel':{const z=sub(c,a);return [line(a,b),line(add(a,z),add(b,z)),line(a,add(a,z),{dash:true}),line(b,add(b,z),{dash:true})];}
 case 'pitchfork':{const mid=mix(b,c,.5),z=sub(mid,a);return [line(a,mid,{extend:'end'}),line(b,add(b,z),{extend:'end'}),line(c,add(c,z),{extend:'end'}),line(b,c,{dash:true})];}
 case 'rectangle':return [{kind:'rect',a,b}];
 case 'ellipse':return [{kind:'ellipse',a,b}];
 case 'triangle':return [{kind:'polygon',points:p}];
 case 'text':return [text(a,drawing.text||'Text')];
 case 'callout':return [{kind:'callout',at:a,value:(drawing.text||'Note').slice(0,1000)}];
 case 'measure':return [line(a,b,{dash:true}),text(mix(a,b,.5),'ΔP '+fmt(drawing.anchors[1].price-drawing.anchors[0].price)+' · ΔT '+fmt(drawing.anchors[1].time-drawing.anchors[0].time))];
 case 'fibonacci':return [0,.236,.382,.5,.618,.786,1].flatMap(v=>{const y=a.y+(b.y-a.y)*v,x1=Math.min(a.x,b.x),x2=Math.max(a.x,b.x);return [line({x:x1,y},{x:x2,y}),text({x:x2+5,y},fmt(v))];});
 case 'fib-extension':return [0,.618,1,1.618,2,2.618].flatMap(v=>{const y=c.y+(b.y-a.y)*v,x1=Math.min(b.x,c.x),x2=Math.max(b.x,c.x);return [line({x:x1,y},{x:x2,y}),text({x:x2+5,y},fmt(v))];});
 case 'fib-timezone':return [0,1,2,3,5,8,13,21,34].map(n=>line({x:a.x+(b.x-a.x)*n,y:0},{x:a.x+(b.x-a.x)*n,y:h},{dash:true}));
 case 'fib-fan':return [.382,.5,.618,1].map(v=>line(a,{x:b.x,y:a.y+(b.y-a.y)*v},{extend:'end'}));
 }
 throw TypeError('unimplemented type');
}
export function screenLine(a,b,extent,bounds){
 const dx=b.x-a.x,dy=b.y-a.y;
 if(Math.abs(dx)<1e-12&&Math.abs(dy)<1e-12)return a.x>=0&&a.x<=bounds.width&&a.y>=0&&a.y<=bounds.height?[a,b]:null;
 let lo=extent==='both'?-Infinity:0,hi=extent==='both'||extent==='end'?Infinity:1;
 for(const [p,q] of [[-dx,a.x],[dx,bounds.width-a.x],[-dy,a.y],[dy,bounds.height-a.y]]){
  if(Math.abs(p)<1e-12){if(q<0)return null;continue;}
  const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
 }
 return lo>hi?null:[mix(a,b,lo),mix(a,b,hi)];
}
export function primitiveSegments(s,bounds){
 if(s.kind==='line')return [screenLine(s.a,s.b,s.extend,bounds)].filter(Boolean);
 if(s.kind==='rect'){const v=[s.a,{x:s.b.x,y:s.a.y},s.b,{x:s.a.x,y:s.b.y}];return v.map((p,i)=>[p,v[(i+1)%4]]);}
 if(s.kind==='polygon')return s.points.map((p,i)=>[p,s.points[(i+1)%s.points.length]]);
 if(s.kind==='ellipse'){const {a,b}=s,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,rx=Math.abs(a.x-b.x)/2,ry=Math.abs(a.y-b.y)/2;const p=Array.from({length:65},(_,i)=>({x:cx+rx*Math.cos(i*Math.PI/32),y:cy+ry*Math.sin(i*Math.PI/32)}));return p.slice(1).map((pt,i)=>[p[i],pt]);}
 return [];
}
export function hitDrawing(drawing,point,transform,bounds,threshold=8){
 for(const anchor of drawing.anchors){const p=transform.toScreen(anchor);if(Math.hypot(point.x-p.x,point.y-p.y)<=threshold)return true;}
 const dist=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/n)):0;return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);};
 return drawingPrimitives(drawing,transform,bounds).some(s=>{
  if(s.kind==='text'||s.kind==='callout')return Math.abs(point.x-s.at.x)<90&&Math.abs(point.y-s.at.y)<18;
  return primitiveSegments(s,bounds).some(([a,b])=>dist(a,b)<=threshold);
 });
}
