import assert from 'node:assert/strict';
import {DEFAULTS,SHAPES,PRESETS,generateModel,inspectModel,validateParams} from '../lib/model.mjs';
import {BASE_DEFAULTS,BASE_SHAPES,generateBase,validateBase} from '../lib/base-model.mjs';
import {fuzzyRelief} from '../lib/fuzzy-texture.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {validateProject} from '../lib/design-project.mjs';
import {parseSTL,measureRecesses} from './geometry-checks.mjs';
const p={...DEFAULTS,texture:'fuzzy',fuzzyDepth:.5,fuzzySpacing:2,fuzzyStretch:3,lockTop:true};
assert.ok(Math.abs(fuzzyRelief(p,0,90,50)-fuzzyRelief(p,2*Math.PI,90,50))<1e-8,'circumference has no noise seam');
assert.equal(fuzzyRelief(p,.4,90,50),fuzzyRelief(p,.4,90,50),'grain is deterministic');
assert.notEqual(fuzzyRelief(p,.4,90,50),fuzzyRelief({...p,fuzzySeed:18},.4,90,50),'new seed changes grain');
for(const patch of [{fuzzyDepth:-1},{fuzzySpacing:0},{fuzzyStretch:1.5},{fuzzySeed:10000}]){assert.throws(()=>validateParams({...p,...patch}));assert.throws(()=>validateBase({...BASE_DEFAULTS,...patch}));}
for(const shape of SHAPES){const params={...DEFAULTS,...PRESETS[shape],shape,texture:'fuzzy'};assert.ok(inspectModel(generateModel(params,{segments:192,layers:64,pocketSegments:64})).valid,`${shape} fuzzy shade`);}
for(const shape of BASE_SHAPES)assert.ok(inspectModel(generateBase({...BASE_DEFAULTS,shape,texture:'fuzzy'})).valid,`${shape} fuzzy base`);
const m=generateModel(p),smooth=generateModel({...p,texture:'smooth'},{segments:m.segments,layers:m.layers,pocketSegments:96});
let roughVertices=0;
for(let k=0;k<=m.layers;k++)for(let i=0;i<m.segments;i++){
 const outer=(3*m.segments+(k*m.segments+i)*2)*3,inner=outer+3;
 for(let j=0;j<3;j++)assert.equal(m.positions[inner+j],smooth.positions[inner+j],'inner shade wall stays unchanged');
 if(m.positions[outer]!==smooth.positions[outer]||m.positions[outer+1]!==smooth.positions[outer+1])roughVertices++;
}
assert.ok(roughVertices>1000,'surface relief is actual geometry');
for(let i=0;i<m.positions.length;i+=3)if(m.positions[i+2]<=5||m.positions[i+2]===p.height)assert.deepEqual(m.positions.slice(i,i+3),smooth.positions.slice(i,i+3),'mounting rim, pockets and locked top stay unchanged');
for(const params of [p,{...p,shape:'cube',height:100,diameter:100,topDiameter:100,socketDiameter:42,twist:0,curve:0,fuzzyDepth:1,fuzzySpacing:.8,fuzzyStretch:1}]){
 const parsed=parseSTL(createBinarySTL(params));assert.ok(inspectModel({...parsed,params,pockets:[0,1,2]}).valid,'exported fuzzy shade is closed');measureRecesses(parsed,params);
}
for(const params of [{...BASE_DEFAULTS,texture:'fuzzy'},{...BASE_DEFAULTS,texture:'fuzzy',shape:'square',profile:'straight',diameter:180,height:6,fuzzyDepth:1,fuzzySpacing:.8,fuzzyStretch:1}]){
 const b=generateBase(params),plain=generateBase({...params,texture:'smooth'},{segments:b.segments,layers:b.layers,pocketSegments:96});
 for(let i=0;i<b.positions.length;i+=3)if(b.positions[i+2]===0||b.positions[i+2]===params.height)assert.deepEqual(b.positions.slice(i,i+3),plain.positions.slice(i,i+3),'base caps and recess floors stay unchanged');
 const parsed=parseSTL(createBinarySTL(params));assert.ok(inspectModel({...parsed,params,pockets:b.pockets}).valid,'exported fuzzy base is closed');
 for(const pocket of b.pockets){for(const id of [...pocket.bottom,...pocket.ceiling])assert.deepEqual(b.positions.slice(id*3,id*3+3),plain.positions.slice(id*3,id*3+3),'base recess floors and walls stay unchanged');const floor=[];for(let i=0;i<parsed.positions.length;i+=3)if(Math.abs(parsed.positions[i+2]-(params.height-3.3))<.00002&&Math.hypot(parsed.positions[i]-pocket.center[0],parsed.positions[i+1]-pocket.center[1])<4.16)floor.push([parsed.positions[i],parsed.positions[i+1]]);assert.ok(floor.length>=128);for(const axis of [0,1])assert.ok(Math.abs(Math.max(...floor.map(v=>v[axis]))-Math.min(...floor.map(v=>v[axis]))-8.3)<.00004);}
}
const project=validateProject({format:'akoi-design',version:1,shade:p,base:{...BASE_DEFAULTS,texture:'fuzzy'}});assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))),project,'save/import retains all fuzzy controls');
console.log('PASS: 16 shade forms, 5 base forms, deterministic seamless grain, smooth interior and mounting surfaces, 4 production STL exports with protected pockets, and editable project round trip.');
