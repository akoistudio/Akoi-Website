import assert from 'node:assert/strict';
import {DEFAULTS,PRESETS,validateParams,applyParameterPatch,generateModel,radiusAt,inspectModel} from '../lib/model.mjs';
import {DIFFUSER_DEFAULTS,validateDiffuser,generateDiffuser,diffuserFit,matchDiffuser,layeredShade} from '../lib/diffuser-model.mjs';
import {BASE_DEFAULTS} from '../lib/base-model.mjs';
import {validateProject,currentProject,restoreProject} from '../lib/design-project.mjs';
import {assembleLamp} from '../lib/assembly.mjs';
import {createBinarySTL,createSTLResponse,stlFilename} from '../lib/stl-download.mjs';
import {parseSTL,measureRecesses,zHits} from './geometry-checks.mjs';
const reference=validateParams({...DEFAULTS,...PRESETS['rounded-cylinder'],shape:'rounded-cylinder',socketDiameter:42});
const smooth={...reference,texture:'smooth',textureDepth:0};
for(const z of [45,70,100,140,170])assert.equal(radiusAt(smooth,(z-5)/215,0),85,'middle has genuinely straight sides');
assert.equal(radiusAt(smooth,0,0),65);assert.equal(radiusAt(smooth,1,0),65);
for(const key of ['bottomShoulder','topShoulder']){const p={...smooth,[key]:55};assert.ok(radiusAt(p,key==='bottomShoulder'?.1:.9,0)<radiusAt(smooth,key==='bottomShoulder'?.1:.9,0),'shoulder independently changes the rounded end');}
assert.throws(()=>validateParams({...reference,bodyDiameter:100}));assert.throws(()=>validateParams({...reference,height:60}));
const shortened=applyParameterPatch(reference,{height:60});assert.ok(shortened.bottomShoulder+shortened.topShoulder<=45);
const diffuser=validateDiffuser(DIFFUSER_DEFAULTS);assert.ok(diffuserFit(diffuser,reference).valid);
assert.ok(!diffuserFit({...diffuser,diameter:160},reference).valid,'collisions and insertion prevented');assert.ok(!diffuserFit({...diffuser,height:220},reference).valid,'height collision prevented');assert.ok(!diffuserFit({...diffuser,socketDiameter:40},reference).valid,'socket obstruction prevented');
assert.throws(()=>validateDiffuser({...diffuser,socketDiameter:95}));
const fitted=matchDiffuser({...diffuser,diameter:145,height:300},reference);assert.ok(diffuserFit(fitted,reference).valid);
for(const p of [reference,{...reference,bodyDiameter:200,bottomShoulder:60,topShoulder:30},{...shortened,texture:'smooth'},{...reference,twist:80,texture:'pleated'}]){
 const parsed=parseSTL(createBinarySTL(p));const mesh={...parsed,params:p,pockets:[]};assert.ok(inspectModel(mesh).valid);measureRecesses(parsed,p);
}
for(const d of [diffuser,{...diffuser,wall:.8,height:20},{...diffuser,wall:3,flangeWidth:8,flangeThickness:5}]){
 const mesh=parseSTL(createBinarySTL(d));assert.ok(inspectModel({...mesh,params:d,pockets:[]}).valid,'exported diffuser is watertight with consistent outward winding');
 assert.deepEqual(zHits(mesh,0,0),[],'socket stays open');assert.deepEqual(zHits(mesh,d.socketDiameter/2+.71,.13),[0,d.flangeThickness],'flange is solid');
 const zs=[...mesh.positions].filter((_,i)=>i%3===2);assert.equal(Math.min(...zs),0);assert.equal(Math.max(...zs),d.height);
 const atBody=[];for(let i=0;i<mesh.positions.length;i+=3)if(Math.abs(mesh.positions[i+2]-d.height)<.0001)atBody.push(Math.hypot(mesh.positions[i],mesh.positions[i+1]));assert.ok(Math.abs(Math.max(...atBody)-Math.min(...atBody)-d.wall)<.00003,'actual exported wall thickness');
}
const old=validateProject({format:'akoi-design',version:1,shade:reference,base:BASE_DEFAULTS});assert.equal(old.diffuserEnabled,false,'old saves remain single-layer');
const project=validateProject({...old,diffuser,diffuserEnabled:true}),values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};restoreProject(storage,JSON.parse(JSON.stringify(project)));assert.deepEqual(currentProject(storage),project,'new controls and inner part survive project round trip');
for(const gap of [0,35]){const assembly=assembleLamp(project,gap,{segments:96,layers:40,pocketSegments:32});assert.equal(assembly.parts.diffuserZ,BASE_DEFAULTS.height+5+2*gap);assert.ok(inspectModel(assembly).valid);}
const outer=generateModel(reference,{segments:96,layers:40,pocketSegments:32});for(const mode of ['both','outer','inner']){const preview=layeredShade(outer,diffuser,mode);assert.ok(inspectModel(preview).valid);assert.equal(preview.outerIndexCount,mode==='both'?outer.indices.length:0);}
const response=createSTLResponse(new Request('https://example.test/api/export-stl?model='+encodeURIComponent(JSON.stringify(diffuser))));assert.equal(response.status,200);assert.ok(response.headers.get('Content-Disposition').includes(stlFilename(diffuser)));assert.ok((await response.arrayBuffer()).byteLength>84);
console.log('PASS: rounded shoulders and straight middle, fit/height/socket/insertion checks, 4 exported outer meshes with exactly 3 blind magnet recesses, 3 exported watertight diffusers and measured walls/open socket, old/new project restoration, layer inspection, assembly seating and STL download response.');
