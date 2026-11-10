'use strict';
const study=StudyRegistry.selectStudy(location.search);
const rawBoards=[window.ART_BOARD,window.ART_STUDY_002,window.ART_STUDY_003,window.ART_STUDY_004,window.ART_STUDY_005,window.ART_STUDY_006,window.ART_STUDY_007];
const board=PuzzleAdapter.normalize(rawBoards[Number(study.id)-1]),M=Connections,storageKey=PuzzlePersistence.key(board);
const $=s=>document.querySelector(s),sources=PuzzleAdapter.imageSources(board,window.ART_IMAGE_SOURCES_BY_BOARD?.[board.id]||(study.id==='6'?window.ART_IMAGE_SOURCES:{}));
for(const [id,fallback] of Object.entries(window.ART_IMAGE_FALLBACKS||{}))if(sources[id])Object.assign(sources[id],fallback);
// Prefer the original service, but do not leave a tile blank through a long
// connection timeout. Both thumbnails and viewer upgrades use retained copies.
function loadArtworkImage(img,primary,fallback){
 return new Promise((resolve,reject)=>{
  let timer=null,usingFallback=false;
  const cleanup=()=>{clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);};
  const loaded=()=>{cleanup();resolve(img);};
  const failed=()=>{clearTimeout(timer);if(fallback&&!usingFallback){usingFallback=true;img.src=fallback;}else{cleanup();reject(new Error('Artwork image unavailable'));}};
  img.addEventListener('load',loaded);img.addEventListener('error',failed);
  if(fallback&&fallback!==primary)timer=setTimeout(failed,5000);
  img.src=primary;
 });
}
document.title=`Art Connections · Puzzle ${study.id}`;
const puzzleNav=$('.puzzles');puzzleNav.replaceChildren();
for(const delta of [-1,0,1]){
 const id=Number(study.id)+delta;
 if(delta===0){const label=document.createElement('span');label.textContent=study.id;label.setAttribute('aria-label',`Puzzle ${study.id}`);puzzleNav.append(label);continue;}
 const available=id>=1&&id<=StudyRegistry.studies.length,el=document.createElement(available?'a':'button');
 el.setAttribute('aria-label',`${delta<0?'Previous':'Next'} puzzle${available?', '+id:' unavailable'}`);
 if(available){const url=new URL(location.href);url.searchParams.delete('reset');url.searchParams.set('study',String(id));el.href=url.pathname+url.search+url.hash;}else el.disabled=true;
 const icon=document.createElement('span');icon.className='symbol';icon.setAttribute('aria-hidden','true');icon.textContent=delta<0?'chevron_left':'chevron_right';el.append(icon);puzzleNav.append(el);
}
const resetURL=new URL(location.href),reset=resetURL.searchParams.get('reset')==='puzzle';
if(reset){try{localStorage.removeItem(storageKey);}catch{}resetURL.searchParams.delete('reset');history.replaceState(null,'',resetURL);}
let state;
try{state=reset?M.shuffleAggregate(M.freshAggregate(board)):PuzzlePersistence.load(localStorage,board,M);}catch{state=M.shuffleAggregate(M.freshAggregate(board));}
// Retain v1 saves and the legacy model API; retire selection in this UI.
state={...state,selected:[]};
let returnFocus=null;
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}}
function update(){
 const completed=state.feedback?.count===4,finished=state.mistakes===0||completed;
 $('#submit').disabled=finished;$('#shuffle').disabled=finished;
 const count=state.feedback?.count;
 $('#correct-groups').replaceChildren(document.createTextNode('Correct groups: '),...Array.from({length:count??0},()=>{const square=document.createElement('span');square.className='correct-square';square.setAttribute('aria-hidden','true');return square;}));
 $('#correct-groups').setAttribute('aria-label',count==null?'Correct groups: not submitted':`Correct groups: ${count} of 4`);
 $('#status').textContent=completed?'Completed':state.mistakes===0?'No tries left':'';
 $('#mistakes').replaceChildren(document.createTextNode('Tries left: '),...Array.from({length:6},(_,i)=>{const dot=document.createElement('span');dot.className='dot'+(i<state.mistakes?' filled':'');dot.setAttribute('aria-hidden','true');return dot;}));
 $('#mistakes').setAttribute('aria-label',`${state.mistakes} tries left`);save();
}
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let viewerAnimation=null,closing=false,sourceTile=null,viewerToken=0;
const viewerShade=document.createElement('div');viewerShade.className='viewer-shade';viewerShade.setAttribute('aria-hidden','true');$('#viewer').prepend(viewerShade);
let chromeAnimations=[];
function fadeViewer(open){
 const elements=[viewerShade,$('#close'),$('#original'),$('#viewer-status')];
 const from=elements.map(el=>getComputedStyle(el).opacity);chromeAnimations.forEach(a=>a.cancel());chromeAnimations=[];
 elements.forEach((el,i)=>{el.style.opacity=open?'1':'0';if(!reduced())chromeAnimations.push(el.animate([{opacity:from[i]},{opacity:open?1:0}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'}));});
}
function rect(el){const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};}
function morph(from,to){
 const img=$('#full-image');viewerAnimation?.cancel();const frame=r=>({left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
 Object.assign(img.style,frame(to));img.style.objectFit='contain';if(reduced())return Promise.resolve();
 img.style.objectFit='cover';viewerAnimation=img.animate([frame(from),frame(to)],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
 const animation=viewerAnimation;return animation.finished.then(()=>{if(viewerAnimation===animation)img.style.objectFit='contain';}).catch(()=>{});
}
function fitted(width,height){const scale=Math.min((innerWidth-24)/width,(innerHeight-100)/height);return {left:(innerWidth-width*scale)/2,top:(innerHeight-height*scale)/2,width:width*scale,height:height*scale};}
function showViewerArtwork(id,trigger,opening=false){
 returnFocus=trigger;sourceTile=trigger;const img=$('#full-image'),thumb=trigger.querySelector('img'),token=++viewerToken;
 img.src=thumb.currentSrc||sources[id].thumbnail;img.alt='Enlarged artwork';img.draggable=false;$('#original').href=sources[id].viewer;$('#viewer-status').textContent='';
 if(opening){chromeAnimations.forEach(a=>a.cancel());[viewerShade,$('#close'),$('#original'),$('#viewer-status')].forEach(el=>el.style.opacity='0');$('#viewer').showModal();fadeViewer(true);$('#close').focus();}
 morph(opening?rect(trigger):fitted(thumb.naturalWidth||1,thumb.naturalHeight||1),fitted(thumb.naturalWidth||1,thumb.naturalHeight||1));
 const high=new Image();
 loadArtworkImage(high,sources[id].viewer,sources[id].fallbackViewer).then(()=>{if(token===viewerToken&&$('#viewer').open&&!closing){img.src=high.src;morph(rect(img),fitted(high.naturalWidth,high.naturalHeight));}}).catch(()=>{if(token===viewerToken&&!closing)$('#viewer-status').textContent='Higher-resolution image unavailable. Try Original.';});
}
function inspect(id,trigger){if(!$('#viewer').open)showViewerArtwork(id,trigger,true);}
function navigateViewer(delta){
 if(!$('#viewer').open||closing)return;
 const next=state.order.indexOf(sourceTile.dataset.id)+delta;
 if(next<0||next>=state.order.length)return;
 const id=state.order[next];showViewerArtwork(id,document.querySelector(`[data-id="${id}"]`));
}
let viewerGesture=null,suppressViewerClick=false;
$('#viewer').addEventListener('pointerdown',e=>{
 if(contacts.size>1){viewerGesture=null;suppressViewerClick=true;return;}
 suppressViewerClick=false;
 if(e.button!==0||e.target.closest('a,button')||(visualViewport?.scale||1)>1)return;
 viewerGesture={pointer:e.pointerId,x:e.clientX,y:e.clientY,furthest:0,direction:0,cancelled:false};
});
$('#viewer').addEventListener('pointermove',e=>{
 const g=viewerGesture;if(!g||g.pointer!==e.pointerId)return;
 const dx=e.clientX-g.x,dy=e.clientY-g.y;
 if(!g.direction&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3)g.direction=Math.sign(dx);
 if(g.direction){const distance=dx*g.direction;if(distance<g.furthest-12)g.cancelled=true;g.furthest=Math.max(g.furthest,distance);suppressViewerClick=true;}
});
$('#viewer').addEventListener('pointerup',e=>{
 const g=viewerGesture;viewerGesture=null;if(!g||g.pointer!==e.pointerId||g.cancelled)return;
 const dx=e.clientX-g.x,dy=e.clientY-g.y;
 if(Math.abs(dx)>=40&&Math.abs(dx)>Math.abs(dy)*1.3){suppressViewerClick=true;navigateViewer(dx<0?1:-1);}
});
$('#viewer').addEventListener('pointercancel',()=>{viewerGesture=null;suppressViewerClick=true;});
$('#viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();navigateViewer(e.key==='ArrowRight'?1:-1);}});
async function closeViewer(){
 if(closing||!$('#viewer').open)return;closing=true;++viewerToken;
 fadeViewer(false);await morph(rect($('#full-image')),rect(sourceTile));$('#viewer').close();viewerAnimation?.cancel();chromeAnimations.forEach(a=>a.cancel());closing=false;$('#viewer-status').textContent='';
}
const locked=()=>state.mistakes===0||state.feedback?.count===4;
let gestureState=null;const contacts=new Set();const settlements=new Set();
function finishSettlements(){for(const finish of [...settlements])finish();}
function settleGhost(g,destination){
 if(!g.ghost)return;const ghost=g.ghost,tile=document.querySelector(`[data-id="${g.id}"]`),to=destination||rect(tile);
 tile.classList.add('ghost-owned');let animation,done=false;
 const finish=()=>{if(done)return;done=true;tile.classList.remove('ghost-owned');ghost.remove();animation?.cancel();settlements.delete(finish);};
 settlements.add(finish);if(reduced()){finish();return;}
 animation=ghost.animate([{left:ghost.style.left,top:ghost.style.top,transform:getComputedStyle(ghost).transform,boxShadow:getComputedStyle(ghost).boxShadow,opacity:1},{left:to.left+'px',top:to.top+'px',transform:'rotate(0deg)',boxShadow:'0 0 0 rgba(0, 0, 0, 0)',opacity:1}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
 animation.finished.then(finish,finish);
}
function clearTarget(){document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));}
function finishGesture(e,cancelled=false){
 const g=gestureState;if(!g||e&&g.pointer!==e.pointerId)return;
 gestureState=null;clearTarget();g.b.classList.remove('drag-source');document.body.style.cursor='';
 if(g.b.hasPointerCapture(g.pointer))g.b.releasePointerCapture(g.pointer);
 const target=e&&document.elementFromPoint(e.clientX,e.clientY)?.closest('.tile');
 if(g.moved){let destination;if(!cancelled&&target&&!locked(target.dataset.id)){state=M.swapAggregate(state,g.id,target.dataset.id);$('#status').textContent='';destination=render(true,g.id).get(g.id);}settleGhost(g,destination);}
 else if(!cancelled&&target===g.b)inspect(g.id,g.b);
}
function cancelGesture(){finishGesture(null,true);}
document.addEventListener('pointerdown',e=>{contacts.add(e.pointerId);if(contacts.size>1)cancelGesture();},true);
document.addEventListener('pointerup',e=>contacts.delete(e.pointerId),true);
document.addEventListener('pointercancel',e=>{contacts.delete(e.pointerId);finishGesture(e,true);},true);
window.addEventListener('blur',()=>{cancelGesture();contacts.clear();});
window.addEventListener('scroll',()=>{cancelGesture();finishSettlements();},{capture:true,passive:true});
function bindGesture(b,id){
 b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('dragstart',e=>e.preventDefault());
 b.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary||contacts.size!==1)return;cancelGesture();finishSettlements();const r=rect(b);
  gestureState={pointer:e.pointerId,x:e.clientX,y:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,b,id,moved:false,ghost:null};b.setPointerCapture(e.pointerId);
 });
 b.addEventListener('pointermove',e=>{
  const g=gestureState;if(!g||g.pointer!==e.pointerId)return;
  const samples=[...(e.getCoalescedEvents?.()||[]),e];if(!g.moved&&!samples.some(p=>Math.hypot(p.clientX-g.x,p.clientY-g.y)>=8))return;
  // Intent stays monotonic, including locked sources and backtracking.
  if(!g.moved){g.moved=true;if(locked(id))return;const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.style.width=rect(b).width+'px';ghost.style.transformOrigin=`${g.dx}px ${g.dy}px`;const image=b.querySelector('img'),canvas=document.createElement('canvas');canvas.width=image.naturalWidth||rect(b).width;canvas.height=image.naturalHeight||rect(b).height;if(image.complete&&image.naturalWidth){canvas.getContext('2d').drawImage(image,0,0);ghost.append(canvas);}else ghost.append(image.cloneNode());document.body.append(ghost);g.ghost=ghost;b.classList.add('drag-source');document.body.style.cursor='grabbing';}
  if(!g.ghost)return;g.ghost.style.left=(e.clientX-g.dx)+'px';g.ghost.style.top=(e.clientY-g.dy)+'px';
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.tile');clearTarget();if(target&&target!==b&&!locked(target.dataset.id))target.classList.add('drop-target');e.preventDefault();
 });
 b.addEventListener('pointerup',e=>finishGesture(e));
 b.addEventListener('lostpointercapture',e=>{if(e.target===b&&gestureState?.pointer===e.pointerId)finishGesture(e,true);});
}
function tile(id){
 const wrap=document.createElement('div');wrap.className='artwork';wrap.dataset.key=id;
 const b=document.createElement('button');b.type='button';b.className='tile';b.dataset.id=id;b.setAttribute('aria-label','Enlarge artwork');b.setAttribute('aria-describedby','inspection-help');
 const img=document.createElement('img');img.alt='';img.draggable=false;
 loadArtworkImage(img,sources[id].thumbnail,sources[id].fallbackThumbnail).catch(()=>{});
 b.append(img);bindGesture(b,id);
 b.addEventListener('click',e=>{if(e.detail===0)inspect(id,b);});
 b.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '||e.key.toLowerCase()==='v'||e.key==='F2'){e.preventDefault();inspect(id,b);return;}if(e.key==='Escape'){cancelGesture();return;}
  const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4};if(!e.shiftKey||!(e.key in offsets))return;e.preventDefault();
  const i=state.order.indexOf(id),j=i+offsets[e.key];if(j<0||j>=16||(e.key==='ArrowLeft'&&i%4===0)||(e.key==='ArrowRight'&&i%4===3))return;
  const next=M.swapAggregate(state,id,state.order[j]);if(next!==state){state=next;render(true);b.focus({preventScroll:true});}
 });wrap.append(b);return wrap;
}
function render(animate=false,heldId=null){
 const existing=new Map([...document.querySelectorAll('.artwork')].map(el=>[el.dataset.key,el]));
 const before=new Map([...existing].map(([id,el])=>[id,rect(el)])),focus=document.activeElement?.dataset.id;
 for(const el of existing.values())el.getAnimations().forEach(a=>a.cancel());
 const boardEl=$('#board'),fragment=document.createDocumentFragment();
 for(let i=0;i<4;i++){
  const row=document.createElement('section');row.className='puzzle-row';row.setAttribute('aria-label',`Group row ${i+1}`);
  const pictures=document.createElement('div');pictures.className='row-pictures';for(const id of state.order.slice(i*4,i*4+4))pictures.append(existing.get(id)||tile(id));row.append(pictures);
  fragment.append(row);
 }
 boardEl.replaceChildren(fragment);update();if(focus)document.querySelector(`[data-id="${focus}"]`)?.focus({preventScroll:true});
 const destinations=new Map([...document.querySelectorAll('.artwork')].map(el=>[el.dataset.key,rect(el)]));
 if(animate&&!reduced())for(const el of document.querySelectorAll('.artwork')){const old=before.get(el.dataset.key),to=destinations.get(el.dataset.key);if(el.dataset.key!==heldId&&old&&(old.left!==to.left||old.top!==to.top))el.animate([{transform:`translate(${old.left-to.left}px,${old.top-to.top}px)`},{transform:'translate(0,0)'}],{duration:430,easing:'cubic-bezier(.2,.7,.2,1)'});}return destinations;
}
$('#shuffle').onclick=()=>{cancelGesture();state=M.shuffleAggregate(state);render(true);};
$('#submit').onclick=()=>{cancelGesture();const r=M.submitAggregate(state,board);state=r.state;render();};
$('#close').onclick=closeViewer;$('#viewer').addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
$('#viewer').addEventListener('click',e=>{if(suppressViewerClick){suppressViewerClick=false;return;}if(e.target!==$('#full-image')&&!e.target.closest('a,button'))closeViewer();});
$('#viewer').addEventListener('close',()=>{returnFocus?.focus({preventScroll:true});});
window.addEventListener('resize',()=>{cancelGesture();finishSettlements();if($('#viewer').open&&!closing){const img=$('#full-image');morph(rect(img),fitted(img.naturalWidth||1,img.naturalHeight||1));}});
render();
