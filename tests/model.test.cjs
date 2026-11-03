const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../core.js');

function fixture() {
  return Array.from({length:16},(_,i)=>({id:String(i),group:Math.floor(i/4),eligibleGroups:[Math.floor(i/4)]}));
}

test('a truthful cross-category row is accepted even outside its assigned group', () => {
  const works=fixture();
  works[4].eligibleGroups=[1,0];
  const order=['0','1','2','4','3','5','6','7','8','9','10','11','12','13','14','15'];
  assert.equal(model.checkRows(order,works)[0],0);
  assert.equal(model.checkRows(order,works)[1],null);
});

test('completion requires four distinct relations, not four truthful rows of the same relation', () => {
  assert.equal(typeof model.isComplete,'function');
  const works=fixture();
  works.forEach(work=>{work.eligibleGroups=[0];});
  assert.equal(model.isComplete(works.map(w=>w.id),works),false);
  const legacy=fixture().map(({eligibleGroups,...work})=>work);
  assert.equal(model.isComplete(legacy.map(w=>w.id),legacy),true);
});

test('published study 3 accepts its real fifth-member cross and requires a complete partition', () => {
  const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../studies/003/board.js'),'utf8'),context);
  const works=JSON.parse(JSON.stringify(context.window.ART_STUDY_003.works));
  const solved=works.map(w=>w.id);
  assert.equal(model.isComplete(solved,works),true);
  assert.deepEqual([0,1,2,3].map(group=>works.filter(w=>w.eligibleGroups.includes(group)).length),[5,5,4,5]);
  const cross=model.swap(solved,3,5);
  assert.deepEqual(model.checkRows(cross,works),[0,null,2,3]);
  assert.equal(model.isComplete(cross,works),false);
  assert.deepEqual(model.checkRows(Array(16).fill(solved[0]),works),[null,null,null,null]);
});
