(function(root){
'use strict';
const key=board=>'art-connections-public:'+board.id+':v1';
function load(storage,board,M){
 try{
  const saved=storage.getItem(key(board));
  if(saved!==null)return M.restoreAggregate(saved,board);
  // Old public app stored the order and hint disclosures separately. Keep both
  // old keys untouched; hints are retired from this anonymous-feedback UI.
  const order=JSON.parse(storage.getItem(board.id+':order'));
  const ids=board.works.map(w=>w.id);
  if(Array.isArray(order)&&order.length===16&&new Set(order).size===16&&order.every(id=>ids.includes(id)))return {...M.freshAggregate(board),order:[...order]};
 }catch{}
 return M.shuffleAggregate(M.freshAggregate(board));
}
const api={key,load};if(typeof module!=='undefined')module.exports=api;else root.PuzzlePersistence=api;
})(globalThis);
