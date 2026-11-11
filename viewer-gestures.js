'use strict';
// One owner for viewer transforms. Multi-contact sequences stay consumed until
// every contact is lifted; the last finger can never become a navigation swipe.
window.ArtworkGestures=function({dialog,image,navigate,close,prepare,maxZoom=4}){
 let scale=1,x=0,y=0,points=new Map(),gesture=null,pinch=null,consumed=false,animation=null;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const base=()=>({cx:parseFloat(image.style.left)+parseFloat(image.style.width)/2,cy:parseFloat(image.style.top)+parseFloat(image.style.height)/2,w:parseFloat(image.style.width),h:parseFloat(image.style.height)});
 function clamp(){const b=base(),bx=Math.max(0,(b.w*scale-innerWidth)/2),by=Math.max(0,(b.h*scale-(innerHeight-100))/2);x=Math.max(-bx,Math.min(bx,x));y=Math.max(-by,Math.min(by,y));}
 function paint(){image.style.transform=`translate(${x}px, ${y}px) scale(${scale})`;image.dataset.zoom=String(scale);}
 function settle(){const from=getComputedStyle(image).transform;clamp();paint();if(!reduced()){animation?.cancel();animation=image.animate([{transform:from},{transform:image.style.transform}],{duration:180,easing:'ease-out'});}}
 function reset(){animation?.cancel();animation=null;scale=1;x=y=0;gesture=null;pinch=null;points.clear();paint();}
 function zoom(next,cx,cy,previous={x:cx,y:cy}){const b=base(),ratio=Math.max(1,Math.min(maxZoom,next))/scale;x=cx-b.cx-(previous.x-b.cx-x)*ratio;y=cy-b.cy-(previous.y-b.cy-y)*ratio;scale=Math.max(1,Math.min(maxZoom,next));clamp();paint();}
 const pair=()=>{const [a,b]=[...points.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};};
 dialog.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('a,button')||!dialog.open)return;
  if(!points.size){consumed=false;prepare();animation?.cancel();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,sx:x,sy:y,zoomed:scale>1.001,mode:null,furthest:0,cancelled:false};}
  points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(points.size>1){consumed=true;gesture=null;pinch=pair();}
  (e.target===image?image:dialog).setPointerCapture(e.pointerId);
 });
 dialog.addEventListener('pointermove',e=>{
  if(!points.has(e.pointerId))return;e.preventDefault();points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(points.size>1){const p=pair();if(pinch)zoom(scale*p.d/pinch.d,p.x,p.y,pinch);pinch=p;return;}
  const g=gesture;if(!g)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(g.zoomed){if(Math.hypot(dx,dy)>3)consumed=true;x=g.sx+dx;y=g.sy+dy;clamp();paint();return;}
  if(!g.mode&&Math.hypot(dx,dy)>12){if(Math.abs(dx)>Math.abs(dy)*1.3)g.mode=dx<0?'next':'previous';else if(dy>0&&dy>Math.abs(dx)*1.3)g.mode='down';else g.mode='ignore';}
  if(g.mode){consumed=true;const distance=g.mode==='down'?dy:g.mode==='next'?-dx:dx;if(distance<g.furthest-12)g.cancelled=true;g.furthest=Math.max(g.furthest,distance);if(g.mode==='down'){x=0;y=Math.max(0,dy);}else if(g.mode!=='ignore'){x=dx;y=0;}paint();}
 });
 function end(e,cancelled){if(!points.has(e.pointerId))return;points.delete(e.pointerId);const g=gesture;gesture=null;pinch=null;
  if(points.size){consumed=true;return;}if(cancelled){consumed=true;settle();return;}
  if(g&&!g.zoomed&&!g.cancelled){const dx=e.clientX-g.x,dy=e.clientY-g.y;
   const distance=g.mode==='down'?dy:g.mode==='next'?-dx:dx;
   if(distance<g.furthest-12){settle();return;}
   if((g.mode==='next'||g.mode==='previous')&&Math.abs(dx)>=48&&Math.abs(dx)>Math.abs(dy)*1.3){x=y=0;paint();navigate(g.mode==='next'?1:-1);return;}
   if(g.mode==='down'&&dy>=100&&dy>Math.abs(dx)*1.3){close();return;}}
  settle();
 }
 dialog.addEventListener('pointerup',e=>end(e,false));dialog.addEventListener('pointercancel',e=>end(e,true));
 dialog.addEventListener('lostpointercapture',e=>{if(points.has(e.pointerId))end(e,true);});
 dialog.addEventListener('wheel',e=>{if(e.target!==image)return;e.preventDefault();prepare();consumed=true;zoom(scale*Math.exp(-e.deltaY*.002),e.clientX,e.clientY);},{passive:false});
 image.addEventListener('dblclick',e=>{e.preventDefault();prepare();consumed=true;zoom(scale>1?1:2,e.clientX,e.clientY);});
 dialog.addEventListener('keydown',e=>{if(['+','=','-','0'].includes(e.key)){e.preventDefault();prepare();const b=base();zoom(e.key==='0'?1:scale*(e.key==='-'?.8:1.25),b.cx,b.cy);}});
 window.addEventListener('blur',()=>{points.clear();gesture=null;pinch=null;consumed=true;settle();});
 reset();return {reset,settle,consumeClick:()=>consumed,get zoom(){return scale;},get active(){return points.size>0;}};
};
