import assert from 'node:assert/strict';
import {DEFAULTS,generateModel,inspectModel,applyParameterPatch} from '../lib/model.mjs';
import {randomShade,RANDOM_FAMILIES} from '../lib/random-shade.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {parseSTL,measureRecesses} from './geometry-checks.mjs';

let seed=1937;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const seen=new Set(),representatives=new Map();let previous='';
for(let i=0;i<100;i++){
 const current={...DEFAULTS,diameter:i%4===3?300:180,socketDiameter:[10,42,152,272][i%4],wall:[1.2,2,5][i%3]};
 const result=randomShade(current,random,previous);assert.notEqual(result.family,previous);
 previous=result.family;seen.add(previous);if(!representatives.has(previous))representatives.set(previous,result.params);
 const p=result.params;assert.equal(p.socketDiameter,current.socketDiameter);assert.equal(p.wall,current.wall);
 assert.deepEqual(applyParameterPatch(current,p),p,'generated design is one valid editor update');
 const model=generateModel(p,{segments:192,layers:64,pocketSegments:64});
 const report=inspectModel(model);assert.equal(report.valid,true,`${i} ${previous}: ${JSON.stringify(report)}`);
 assert.equal(report.recessCount,3);assert.equal(report.backingMm,1.7);
}
assert.equal(seen.size,RANDOM_FAMILIES.length);
for(const [family,p] of representatives){
 const parsed=parseSTL(createBinarySTL(p));
 assert.equal(inspectModel({...parsed,params:p,pockets:[0,1,2]}).valid,true,`${family} STL topology`);
 measureRecesses(parsed,p);
 console.log(`${family}: exported STL is closed; three Ø8.3 × 3.3 mm blind pockets, 5 mm rim.`);
}
assert.throws(()=>randomShade(DEFAULTS,()=>NaN));
assert.throws(()=>randomShade(DEFAULTS,()=>1));
console.log(`PASS: 100 generated shades, all ${seen.size} families, ${representatives.size} re-imported production-resolution STL exports.`);
