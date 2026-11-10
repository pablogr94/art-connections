(function(root){
'use strict';
function normalize(raw){
 if(!raw||!Array.isArray(raw.groups)||raw.groups.length!==4||!Array.isArray(raw.works)||raw.works.length!==16)throw new Error('Invalid puzzle');
 const groups=raw.groups.map(g=>({...g})),ids=groups.map(g=>g.id);
 if(new Set(ids).size!==4||new Set(raw.works.map(w=>w.id)).size!==16)throw new Error('Duplicate puzzle IDs');
 const works=raw.works.map(w=>{const eligibleGroups=[...(w.eligibleGroups??[w.group])];if(!eligibleGroups.length||eligibleGroups.some(id=>!ids.includes(id)))throw new Error('Invalid eligibility');return {...w,eligibleGroups};});
 return {...raw,groups,works};
}
function imageSources(board,exact={}){
 return Object.fromEntries(board.works.map(w=>{if(exact[w.id])return [w.id,{...exact[w.id]}];const remote=typeof w.sourceImage==='string'&&w.sourceImage.startsWith('https://')?w.sourceImage:null;const thumbnail=typeof w.sourceThumbnail==='string'&&w.sourceThumbnail.startsWith('https://')?w.sourceThumbnail:null;return [w.id,{thumbnail:thumbnail||remote||w.thumb||w.image,viewer:remote||w.image,...(remote&&w.image?{fallbackThumbnail:w.thumb||w.image,fallbackViewer:w.image}:{})}];}));
}
const api={normalize,imageSources};if(typeof module!=='undefined')module.exports=api;else root.PuzzleAdapter=api;
})(globalThis);
