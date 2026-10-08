import assert from 'node:assert/strict';
import {DEFAULTS,SHAPES,PRESETS,inspectModel,radiusAt,sectionScale} from '../lib/model.mjs';
import {LID_DEFAULTS,validateLid,matchShadeLid,generateLid,lidRim,lidMatches} from '../lib/lid-model.mjs';
import {validateProject,currentProject,restoreProject} from '../lib/design-project.mjs';
import {BASE_DEFAULTS} from '../lib/base-model.mjs';
import {assembleLamp} from '../lib/assembly.mjs';
import {createBinarySTL,stlFilename,createSTLResponse,stlDownloadUrl} from '../lib/stl-download.mjs';
import {parseSTL,zHits} from './geometry-checks.mjs';
const cases=SHAPES.map(shape=>matchShadeLid(LID_DEFAULTS,{...DEFAULTS,...PRESETS[shape],shape}));
cases.push(validateLid({...LID_DEFAULTS,ventDiameter:20}),validateLid({...LID_DEFAULTS,height:3,grooveDepth:1.8,clearance:0}),matchShadeLid({...LID_DEFAULTS,grooveDepth:6,height:8},{...DEFAULTS,shape:'cube',lockTop:true,twist:70,leanX:18,leanY:-7}));
for(const p of cases){
 const m=generateLid(p),parsed=parseSTL(createBinarySTL(p));assert.ok(inspectModel({...m,...parsed}).valid,`${p.source.shape} lid STL is a closed solid`);
 for(let i=0;i<12;i++){
  const a=(i+.173)/12*Math.PI*2,{outer,inner}=lidRim(p,a),r=(outer+inner)/2;
  assert.deepEqual(zHits(parsed,r*Math.cos(a),r*Math.sin(a)),[p.grooveDepth,p.height],'underside groove is open below and has a closed roof');
  assert.deepEqual(zHits(parsed,(outer+p.lipWidth/2)*Math.cos(a),(outer+p.lipWidth/2)*Math.sin(a)),[0,p.height],'outer retaining lip remains solid');
 }
 assert.deepEqual(zHits(parsed,.131,.117),p.ventDiameter?[]:[0,p.height],'optional center opening works');
}
const shade={...DEFAULTS,shape:'cube',topDiameter:110,twist:0,curve:0,lockTop:true},lid=matchShadeLid(LID_DEFAULTS,shade);
assert.ok(lidMatches(lid,shade));assert.ok(!lidMatches(lid,{...shade,topDiameter:120}));
for(let i=0;i<32;i++){
 const a=i/32*Math.PI*2,profile=lidRim(lid,a),ro=radiusAt(shade,1,a),ri=ro-shade.wall*sectionScale(shade,a);
 assert.ok(profile.outer>=ro+lid.clearance-1e-8&&profile.inner<=ri-lid.clearance+1e-8,'groove encloses the rim with clearance on both sides');
}
for(const patch of [{height:3,grooveDepth:3},{clearance:-1},{grooveDepth:9},{ventDiameter:100},{source:{...DEFAULTS,texture:'woven',smoothTop:0}}])assert.throws(()=>validateLid({...LID_DEFAULTS,...patch}));
const project=validateProject({format:'akoi-design',version:1,shade,base:BASE_DEFAULTS,lid,lidEnabled:true,finishes:{lid:'#343331'}}),values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
restoreProject(storage,project);assert.deepEqual(currentProject(storage),project,'project save/load preserves editable lid and visibility');
assert.equal(validateProject({format:'akoi-design',version:1,shade:DEFAULTS,base:BASE_DEFAULTS}).lidEnabled,false,'old projects remain compatible');
for(const gap of [0,40]){const a=assembleLamp(project,gap);assert.ok(inspectModel(a).valid);assert.equal(a.parts.lidZ+lid.grooveDepth,a.parts.shadeZ+shade.height+gap,'groove roof seats at the top rim, or moves above it in exploded view');assert.ok(a.parts.lid);}
assert.match(stlFilename(lid),/^akoi-lid-cube-/);const response=createSTLResponse(new Request('https://test.local'+stlDownloadUrl(lid)));assert.equal(response.status,200);assert.match(response.headers.get('Content-Disposition'),/lid-cube/);
console.log(`PASS: ${cases.length} re-imported lid STLs; continuous blind groove + solid lip, fit clearances, roof thickness constraints, opening, assembly seating, and saved project compatibility.`);
