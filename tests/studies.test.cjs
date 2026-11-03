const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={URLSearchParams};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../studies.js'),'utf8'),context);
test('all three studies have direct links and old links still default to one',()=>{
  for(const id of ['1','2','3']) assert.equal(context.StudyRegistry.selectStudy('?study='+id).id,id);
  assert.equal(context.StudyRegistry.selectStudy('').id,'1');
  assert.equal(context.StudyRegistry.selectStudy('?study=999').id,'1');
});
