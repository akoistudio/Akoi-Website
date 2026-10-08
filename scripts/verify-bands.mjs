import assert from 'node:assert/strict';
import {DEFAULTS,SHAPES,PRESETS,generateModel,inspectModel,radiusAt,sectionScale,applyParameterPatch} from '../lib/model.mjs';
import {SCULPTURE_PRESETS} from '../lib/sculpture-presets.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {parseSTL,measureRecesses} from './geometry-checks.mjs';

const preset=SCULPTURE_PRESETS.find(p=>p.name==='Banded square');
assert.ok(preset);
const p=applyParameterPatch(DEFAULTS,{...DEFAULTS,...preset.params});
assert.equal(p.texture,'bands');assert.equal(p.shape,'cube');
// Each un-twisted horizontal square section must have four truly flat faces,
// rather than circular relief bowing the middle of the sides.
for(const z of [7,16,32,60,105,158,178,180]){
 const t=(z-5)/(p.height-5),halfWidth=radiusAt(p,t,0);
 for(let i=0;i<64;i++){
  const a=i/64*Math.PI*2,r=radiusAt(p,t,a);
  assert.ok(Math.abs(Math.max(Math.abs(r*Math.cos(a)),Math.abs(r*Math.sin(a)))-halfWidth)<1e-9);
 }
 assert.ok(Math.abs(halfWidth-p.wall-(radiusAt(p,t,Math.PI/4)-p.wall*sectionScale(p,Math.PI/4))/Math.SQRT2)<1e-9,'inner square has constant face-normal wall thickness');
}
const tForCycle=u=>(p.smoothBottom+u*(p.height-5-p.smoothBottom-p.smoothTop)/p.ringCount)/(p.height-5);
assert.ok(radiusAt(p,tForCycle(3.5),0)-radiusAt(p,tForCycle(3),0)>.79,'real recessed seams separate broad panels');
assert.equal(radiusAt(p,tForCycle(3.25),0),radiusAt(p,tForCycle(3.5),0),'panel remains flat between seams');
for(const shape of SHAPES){
 const params=applyParameterPatch(DEFAULTS,{...PRESETS[shape],shape,texture:'bands'});
 assert.equal(inspectModel(generateModel(params,{segments:192,layers:64,pocketSegments:64})).valid,true,`${shape}: banded geometry`);
}
const cases=[p,{...p,ringCount:2,ringDepth:0,ringSharpness:0},{...p,ringCount:24,ringDepth:12,ringSharpness:100,lockTop:false,smoothTop:0},{...p,shape:'rounded-square',depthRatio:75,twist:35,leanX:12,ringCount:10,ringDepth:2}];
for(const params of cases){
 const parsed=parseSTL(createBinarySTL(params));
 assert.equal(inspectModel({...parsed,params,pockets:[0,1,2]}).valid,true,'exported banded STL is closed and consistently wound');
 measureRecesses(parsed,params);
}
console.log('PASS: preset, 16 forms, square face planarity and wall thickness, true broad panels, 4 production STL exports with exact closed-bottom magnet recesses.');
