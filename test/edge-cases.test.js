import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanSeed} from '../dist/src/core.js';
import {answerMatches,validConfig,makeQuestion,makeFamilyQuestion,updateMistakes,mistakeFor} from '../dist/src/bank.js';
import {conditionKey,loadAchievements,recordAttempt} from '../dist/src/achievements.js';
import {PROGRESS_KEY,reportProgress,clearProgress} from '../dist/src/progress.js';
test('edge: seed entry accepts 1 and 40 chars, trims and rejects just outside/types',()=>{
  for(const value of ['a','A0-'.repeat(13)+'a'])assert.equal(cleanSeed(' '+value+' '),value);
  for(const value of ['', ' ', 'a'.repeat(41), '한글', 'x_y', null, 1, NaN, Infinity, []])assert.throws(()=>cleanSeed(value));
});
test('edge: numeric grader length, signed fraction, zero and tolerance boundaries',()=>{
  for(const [input,expected]of [['−2 / 4','-0.5'],['-1/-2','0.5'],['-0','0'],['0'.repeat(79)+'1','1'],['1.0000000009','1']])assert.equal(answerMatches(input,expected),true);
  for(const input of ['', ' ',null,0,NaN,Infinity,[], '1/0','0/0','Infinity','NaN','1e309','0'.repeat(80)+'1','1.0000000011'])assert.equal(answerMatches(input,'1'),false);
});
test('edge: replay configuration integer/version/type boundaries preserve legacy seed semantics',()=>{
  const base={topic:'algebra',level:1,seed:'',index:0};
  assert.equal(validConfig(base),true,'empty stored legacy seed is intentionally retained');
  assert.equal(validConfig({...base,index:Number.MAX_SAFE_INTEGER}),true);
  for(const patch of [{level:0},{level:5},{level:'1'},{level:NaN},{seed:null},{seed:'a'.repeat(41)},{index:-1},{index:1.5},{index:Infinity},{index:Number.MAX_SAFE_INTEGER+1},{bankVersion:0},{bankVersion:99},{topic:'__proto__'}])
    assert.equal(validConfig({...base,...patch}),false);
});
test('edge: mistake capacity 199 to 200, duplicate and oversized legacy retention is immutable',()=>{
  const q=makeQuestion('calculus',4,'edge',0),item=mistakeFor(q);
  const initial=Array.from({length:199},(_,index)=>({topic:'numbers',level:1,seed:'old',index}));
  const copy=structuredClone(initial),full=updateMistakes(initial,q,false);
  assert.equal(full.length,200);assert.deepEqual(initial,copy);
  assert.deepEqual(updateMistakes(full,q,false),full);
  const oversized=[...full,{bankVersion:99,note:'future record'}];
  assert.deepEqual(updateMistakes(oversized,makeQuestion('calculus',4,'edge',1),false),oversized);
  assert.deepEqual(updateMistakes(oversized,q,true),[...initial,oversized.at(-1)]);
  assert.deepEqual(oversized.at(-1),{bankVersion:99,note:'future record'});
});
test('edge: 999th evidence can award last slot then saturation never rotates or re-awards',()=>{
  const evidence={version:1,families:[],seen:Array.from({length:999},(_,n)=>'crt|4|'+JSON.stringify({n})),saturated:false};
  const q=makeFamilyQuestion('composition',4,'last-slot'),before=structuredClone(evidence);
  const last=recordAttempt(evidence,q,{correct:true});assert.equal(last.seen.length,1000);assert.deepEqual(last.families,['composition']);
  const blocked=recordAttempt(last,makeFamilyQuestion('bayes',4,'overflow'),{correct:true});
  assert.equal(blocked.saturated,true);assert.deepEqual(blocked.families,['composition']);assert.deepEqual(blocked.seen,last.seen);assert.deepEqual(evidence,before);
});
test('edge: condition key 1024/1025 bounds and defensive copies',()=>{
  const q={...makeFamilyQuestion('composition',4,'key'),params:{s:''}};
  const overhead=conditionKey(q).length;
  q.params.s='x'.repeat(1024-overhead);assert.equal(conditionKey(q).length,1024);
  const record=recordAttempt(null,q,{correct:true}),loaded=loadAchievements(record);
  loaded.seen.push('edited');loaded.families.length=0;assert.equal(record.families.length,1);assert.equal(record.seen.length,1);
  q.params.s+='x';assert.equal(conditionKey(q),null);
  assert.deepEqual(recordAttempt(record,q,{correct:true}),record);
});
test('edge: aggregate exact read cap and readback-denial keep bytes and own deletion isolated',()=>{
  const stamp='2026-10-13T00:00:00.000Z',base=JSON.stringify({version:1,apps:{'light-route':{completed:1,total:8,updatedAt:stamp}}});
  for(const size of [8192,8193]){
    let raw=base+' '.repeat(size-base.length);const before=raw;
    const s={getItem:()=>raw,setItem:(_,v)=>{raw=v;}};
    assert.equal(reportProgress(1,48,s,new Date(stamp)),size===8192);
    if(size===8193)assert.equal(raw,before);
    else assert.equal(JSON.parse(raw).apps['light-route'].completed,1);
  }
  const s={getItem(){throw Error('readback denied');},setItem(){throw Error('must not write');}};
  assert.equal(reportProgress(1,48,s),false);assert.equal(clearProgress(s),false);
  assert.equal(PROGRESS_KEY,'web-lab-progress-v1');
});

