(function(root){
'use strict';
function enumerate(board){
 const covers=[];
 function choose(items,k,start=0,acc=[],out=[]){if(!k){out.push(acc);return out;}for(let i=start;i<=items.length-k;i++)choose(items,k-1,i+1,[...acc,items[i]],out);return out;}
 function visit(index,used,rows){if(index===board.groups.length){if(used.size===board.works.length)covers.push(rows);return;}
 const group=board.groups[index].id;
 for(const ids of choose(board.works.filter(w=>w.eligibleGroups.includes(group)&&!used.has(w.id)).map(w=>w.id),4))visit(index+1,new Set([...used,...ids]),[...rows,{group,ids}]);
 }
 visit(0,new Set(),[]);return covers;
}
const same=(a,b)=>a.length===b.length&&a.every(id=>b.includes(id));
function fresh(board){return {version:1,order:board.works.map(w=>w.id),locks:[],selected:[],mistakes:4};}
function compatible(state,board){return enumerate(board).filter(c=>state.locks.every(l=>c.some(r=>r.group===l.group&&same(r.ids,l.ids))));}
function promote(state,ids){const order=[...state.order],start=state.locks.length*4;const displaced=order.slice(start,start+4).filter(id=>!ids.includes(id)),vacated=ids.map(id=>order.indexOf(id)).filter(i=>i>=start+4).sort((a,b)=>a-b);vacated.forEach((slot,i)=>order[slot]=displaced[i]);order.splice(start,4,...ids);return order;}
function submit(state,ids,board){
 if(state.mistakes===0||ids.length!==4||new Set(ids).size!==4||ids.some(id=>!state.order.includes(id)||state.locks.some(l=>l.ids.includes(id))))return {accepted:false,state};
 const row=compatible(state,board).flat().find(r=>same(r.ids,ids));
 if(!row)return {accepted:false,state:{...state,mistakes:Math.max(0,(state.mistakes??4)-1)}};
 return {accepted:true,state:{...state,order:promote(state,ids),locks:[...state.locks,{group:row.group,ids:[...ids]}],selected:[]}};
}
function toggle(s,id){if(!s.order.includes(id)||s.locks.some(l=>l.ids.includes(id)))return s;return {...s,selected:s.selected.includes(id)?s.selected.filter(x=>x!==id):s.selected.length<4?[...s.selected,id]:s.selected};}
function deselect(s){return {...s,selected:[]};}
function shuffle(s,random=Math.random){const free=s.order.filter(id=>!s.locks.some(l=>l.ids.includes(id)));for(let i=free.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[free[i],free[j]]=[free[j],free[i]];}let i=0;return {...s,order:s.order.map(id=>s.locks.some(l=>l.ids.includes(id))?id:free[i++])};}
function restore(raw,board){try{const s=JSON.parse(raw),base=fresh(board);if(!s||s.version!==1||!Array.isArray(s.order)||!same(s.order,base.order)||new Set(s.order).size!==16||!Array.isArray(s.locks)||s.locks.length>4||!Array.isArray(s.selected)||s.selected.length>4||new Set(s.selected).size!==s.selected.length)throw 0;
 let check=base;for(const l of s.locks){if(!l||!Array.isArray(l.ids))throw 0;const r=submit(check,l.ids,board);if(!r.accepted||r.state.locks.at(-1).group!==l.group)throw 0;check=r.state;}
 if(s.selected.some(id=>!s.order.includes(id)||s.locks.some(l=>l.ids.includes(id))))throw 0;
 if(s.mistakes!==undefined&&(!Number.isInteger(s.mistakes)||s.mistakes<0||s.mistakes>4))throw 0;
 let layout={order:s.order,locks:[]};for(const lock of check.locks)layout={order:promote(layout,lock.ids),locks:[...layout.locks,lock]};
 if(s.rowLayout===true){for(const lock of check.locks)if(!Array.from({length:4},(_,i)=>s.order.slice(i*4,i*4+4)).some(ids=>same(ids,lock.ids)))throw 0;}
 return {version:1,order:s.rowLayout===true?s.order:layout.order,locks:check.locks,selected:s.selected,mistakes:s.mistakes??4,...(s.rowLayout===true?{rowLayout:true}:{})};
 }catch{return fresh(board);}}
// Score every arranged free row against one complete compatible cover at a time.
// Maximizing over covers avoids independently accepting mutually incompatible locks.
function submitRows(state,board){
 if(state.mistakes===0||state.locks.length===4)return {accepted:0,state};
 const rows=[];for(let i=0;i<state.order.length;i+=4){const ids=state.order.slice(i,i+4);if(!state.locks.some(l=>l.ids.some(id=>ids.includes(id))))rows.push(ids);}
 let best=[];
 for(const cover of compatible(state,board)){
  const matches=rows.map(ids=>{const r=cover.find(r=>same(r.ids,ids));return r?{group:r.group,ids:[...ids]}:null;}).filter(Boolean);
  if(matches.length>best.length)best=matches;
 }
 if(!best.length)return {accepted:0,state:{...state,selected:[],mistakes:Math.max(0,state.mistakes-1)}};
 const next={...state,selected:[],rowLayout:true,locks:[...state.locks,...best]};
 return {accepted:best.length,state:next};
}
function swap(state,a,b){
 if(a===b||!state.order.includes(a)||!state.order.includes(b)||state.locks.some(l=>l.ids.includes(a)||l.ids.includes(b)))return state;
 const order=[...state.order],i=order.indexOf(a),j=order.indexOf(b);[order[i],order[j]]=[order[j],order[i]];return {...state,order,selected:[]};
}
// Anonymous feedback never carries row identities or retains legacy locks.
const feedbackMode='aggregate-v3';
function freshAggregate(board){return {...fresh(board),mistakes:6,triesLimit:6,feedbackMode,feedback:null};}
function scoreAggregate(order,board){
 const rows=Array.from({length:4},(_,i)=>order.slice(i*4,i*4+4));
 return Math.max(0,...enumerate(board).map(cover=>rows.filter(ids=>cover.some(r=>same(r.ids,ids))).length));
}
function submitAggregate(state,board){
 if(state.mistakes===0||state.feedback?.count===4)return {count:state.feedback?.count??null,state};
 const count=scoreAggregate(state.order,board);
 return {count,state:{...state,feedbackMode,locks:[],selected:[],mistakes:count===4?state.mistakes:Math.max(0,state.mistakes-1),feedback:{count,order:[...state.order]}}};
}
function restoreAggregate(raw,board){
 try{
  const s=JSON.parse(raw),base=freshAggregate(board);
  if(!s||s.version!==1||!Array.isArray(s.order)||s.order.length!==board.works.length||new Set(s.order).size!==board.works.length||!same(s.order,base.order)||!Number.isInteger(s.mistakes??4)||(s.mistakes??4)<0||(s.mistakes??4)>(s.triesLimit===6?6:4))return base;
  // Do not promote old locks: migration must preserve every saved image position.
  const next={...base,order:[...s.order],mistakes:(s.mistakes??4)+(s.triesLimit===6?0:2)};
  const f=s.feedback;
  if(s.feedbackMode===feedbackMode&&f&&Number.isInteger(f.count)&&f.count>=0&&f.count<=4&&Array.isArray(f.order)&&f.order.length===s.order.length&&f.order.every((id,i)=>id===s.order[i])&&f.count===scoreAggregate(s.order,board))next.feedback={count:f.count,order:[...s.order]};
  return next;
 }catch{return freshAggregate(board);}
}
function swapAggregate(state,a,b){if(state.mistakes===0||state.feedback?.count===4)return state;const next=swap(state,a,b);return next===state?state:{...next,feedback:null};}
function shuffleAggregate(state,random=Math.random){if(state.mistakes===0||state.feedback?.count===4)return state;const next=shuffle(state,random);return next.order.every((id,i)=>id===state.order[i])?state:{...next,feedback:null};}
const api={restoreAggregate,swapAggregate,shuffleAggregate,enumerate,fresh,compatible,promote,submit,submitRows,swap,toggle,deselect,shuffle,restore,freshAggregate,scoreAggregate,submitAggregate};if(typeof module!=='undefined')module.exports=api;else root.Connections=api;
})(globalThis);