const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('Study 4 is selectable without changing legacy defaults or storage identities',()=>{
  const context={URLSearchParams};context.globalThis=context;context.window=context;
  vm.runInNewContext(fs.readFileSync(path.join(root,'studies.js'),'utf8'),context);
  assert.equal(context.StudyRegistry.selectStudy('?study=4').id,'4');
  assert.equal(context.StudyRegistry.selectStudy('').id,'1');
  assert.equal(context.StudyRegistry.selectStudy('?study=3').id,'3');
  vm.runInNewContext(fs.readFileSync(path.join(root,'studies/004/board.js'),'utf8'),context);
  assert.equal(context.ART_STUDY_004.id,'art-connections-lab-004-v1');
  assert.equal(context.ART_STUDY_004.works.length,16);
  for(const work of context.ART_STUDY_004.works){
    assert.ok(work.image.startsWith('studies/004/assets/'));
    assert.ok(fs.existsSync(path.join(root,work.image)));
    assert.ok(fs.existsSync(path.join(root,work.thumb)));
  }
});
