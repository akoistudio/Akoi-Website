import assert from 'node:assert/strict';
import {DEFAULTS,validateParams,generateModel,radiusAt,inspectModel} from '../lib/model.mjs';
import {BASE_DEFAULTS,generateBase} from '../lib/base-model.mjs';
import {clayIndent} from '../lib/clay-texture.mjs';
import {SCULPTURE_PRESETS} from '../lib/sculpture-presets.mjs';
import {validateProject} from '../lib/design-project.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {parseSTL,measureRecesses} from './geometry-checks.mjs';
const p=validateParams({...DEFAULTS,texture:'clay',socketDiameter:42,clayDepth:.8});
let dents=0;
for(let z=20;z<180;z+=1)for(let a=0;a<6.28;a+=.03){const d=clayIndent(p,a,z);assert.ok(d>=0&&d<=p.clayDepth);if(d>.1)dents++;assert.ok(Math.abs(d-clayIndent(p,a+2*Math.PI,z))<1e-9);}
assert.ok(dents>1000);assert.notEqual(clayIndent(p,1,30),clayIndent({...p,claySeed:93},1,30));
for(const name of ['Soft swirl','Gentle waves']){
 const study=validateParams({...DEFAULTS,...SCULPTURE_PRESETS.find(x=>x.name===name).params});
 for(const texture of ['smooth','clay']){const s={...study,texture},m=parseSTL(createBinarySTL(s));assert.ok(inspectModel({...m,params:s,pockets:[]}).valid,name+' export');measureRecesses(m,s);}
}
const model=generateModel(p),baseline={...p,texture:'smooth'};let changed=0;
for(let k=0;k<=model.layers;k++)for(let i=0;i<model.segments;i++){
 const outer=(3*model.segments+(k*model.segments+i)*2)*3,inner=outer+3,r=Math.hypot(model.positions[outer],model.positions[outer+1]),ri=Math.hypot(model.positions[inner],model.positions[inner+1]);assert.ok(r-ri>=p.wall-1e-4,'minimum radial wall retained');
 const plain=radiusAt(baseline,k/model.layers,i/model.segments*2*Math.PI);if(r<plain-.01)changed++;
}
assert.ok(changed>1000,'real indentations, not material-only');
const cube={...p,shape:'cube',height:100,diameter:100,topDiameter:100,curve:0,twist:0,lockTop:true,claySize:3,clayStretch:1};const cm=parseSTL(createBinarySTL(cube));assert.ok(inspectModel({...cm,params:cube,pockets:[]}).valid);measureRecesses(cm,cube);
for(const shape of ['circle','square']){
 const b={...BASE_DEFAULTS,texture:'clay',shape,height:6,clayDepth:.8},m=generateBase(b),plain=generateBase({...b,texture:'smooth'},{segments:m.segments,layers:m.layers});
 for(let i=0;i<m.positions.length;i+=3)if(m.positions[i+2]===0||m.positions[i+2]===b.height)assert.deepEqual(m.positions.slice(i,i+3),plain.positions.slice(i,i+3),'caps and pocket geometry protected');
 const mesh=parseSTL(createBinarySTL(b));assert.ok(inspectModel({...mesh,params:b,pockets:m.pockets}).valid);
}
const project=validateProject({format:'akoi-design',version:1,shade:p,base:{...BASE_DEFAULTS,texture:'clay'}});assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))),project);
assert.equal(validateParams({shape:'bell'}).foldSway,0);assert.throws(()=>validateParams({...p,clayDepth:1}));
console.log('PASS: 7 reimported watertight STL files, 5 shades with exactly 3 blind magnet recesses, minimum clay radial wall, real seamless seeded indentations, protected base caps/pockets, new shape studies and project round trip.');
