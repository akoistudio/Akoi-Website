import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {DEFAULTS,PRESETS,validateParams,applyParameterPatch,radiusAt,generateModel,inspectModel} from '../lib/model.mjs';
import {flowingFold,foldEnvelope} from '../lib/flowing-folds.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {BASE_DEFAULTS} from '../lib/base-model.mjs';
import {validateProject,currentProject,restoreProject} from '../lib/design-project.mjs';
import {fitShadeToVolume,analyzePrint} from '../lib/print-analysis.mjs';
import {parseSTL,measureRecesses} from './geometry-checks.mjs';
const p=validateParams({...DEFAULTS,...PRESETS['flowing-folds'],shape:'flowing-folds',socketDiameter:42});
assert.equal(flowingFold(p,0,0),0);assert.equal(flowingFold({...p,foldTopBlend:40},1,0),0,'optional blending protects top');
for(const count of [2,3,6,8]){
 const s={...p,foldCount:count},t=.5;
 assert.ok(Math.abs(flowingFold(s,t,.28)-flowingFold(s,t,.28+2*Math.PI/count))<1e-8,'fold count controls true broad body repetitions');
 const phase=s.foldRotation*Math.PI/180*t;assert.ok(Math.abs(flowingFold(s,t,phase)-s.foldDepth*foldEnvelope(s,t))<1e-8);
}
const reverse={...p,foldRotation:-120};assert.ok(Math.abs(flowingFold(p,.5,.31)-flowingFold(reverse,.5,-.31))<1e-8,'spiral direction reverses');
assert.notEqual(flowingFold({...p,foldSoftness:0},.5,.4),flowingFold({...p,foldSoftness:100},.5,.4));
assert.equal(radiusAt(p,0,0),p.diameter/2,'bottom is circular');
const exposed={...p,foldTopBlend:0};assert.notEqual(radiusAt(exposed,1,0),radiusAt(exposed,1,Math.PI/3),'unblended top keeps broad folds');
const locked={...exposed,lockTop:true};assert.equal(radiusAt(locked,1,0),p.topDiameter/2,'top lock still works');
for(const patch of [{},{foldCount:8,foldDepth:40,foldRotation:-270,foldSoftness:0,foldBottomBlend:15,foldTopBlend:0},{foldDepth:0,foldCount:2,foldRotation:270},{height:60,diameter:60,topDiameter:30,socketDiameter:32,curve:-30,wall:5,foldDepth:40},{texture:'fluted',textureDepth:3,twist:120,foldCount:6},{...locked}]){
 const s=validateParams({...p,...patch}),mesh=parseSTL(createBinarySTL(s));assert.ok(inspectModel({...mesh,params:s,pockets:[]}).valid,'exported folded shell is watertight, nondegenerate, correctly wound');measureRecesses(mesh,s);
}
const edited=applyParameterPatch(p,{foldCount:5,foldDepth:22.5,foldRotation:-95,foldSoftness:60,foldBottomBlend:75,foldTopBlend:0}),project=validateProject({format:'akoi-design',version:1,shade:edited,base:BASE_DEFAULTS}),map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};restoreProject(storage,JSON.parse(JSON.stringify(project)));assert.deepEqual(currentProject(storage),project,'all fold controls survive save/import');
assert.equal(validateParams({...DEFAULTS}).shape,'bell','existing designs preserve shape');assert.throws(()=>validateParams({...p,foldCount:3.5}));assert.throws(()=>validateParams({...p,foldBottomBlend:0}));assert.throws(()=>validateParams({...p,foldDepth:45}));
const oversized={...p,height:320,diameter:180,topDiameter:160,foldDepth:40};const fitted=fitShadeToVolume(oversized,[200,200,250]);assert.ok(analyzePrint(generateModel(fitted),[200,200,250]).fits,'fit-to-printer scales fold geometry');
const preview=generateModel(p,{segments:144,layers:64,pocketSegments:32});writeFileSync(new URL('../.sites-runtime/flow-preview.json',import.meta.url),JSON.stringify({positions:[...preview.positions],indices:[...preview.indices]}));
console.log('PASS: broad fold count/depth/rotation/softness/blending and top lock, six watertight re-imported STLs with exactly three blind magnet recesses, saved editing controls, printer-volume fit.');
