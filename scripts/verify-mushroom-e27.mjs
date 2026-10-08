import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {DEFAULTS,PRESETS,generateModel,validateParams,applyParameterPatch,radiusAt,inspectModel} from '../lib/model.mjs';
import {BASE_DEFAULTS,validateBase,patchBase,generateBase} from '../lib/base-model.mjs';
import {mushroomProject} from '../lib/mushroom-project.mjs';
import {e27Fit} from '../lib/e27-fit.mjs';
import {e27Opening,e27PlateZ} from '../lib/e27-base.mjs';
import {assembleLamp,mountingMatch} from '../lib/assembly.mjs';
import {validateProject,currentProject,restoreProject} from '../lib/design-project.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {parseSTL,measureRecesses,zHits} from './geometry-checks.mjs';
const project=mushroomProject(),p=project.shade,b=project.base;
assert.equal(p.shape,'mushroom');assert.equal(mountingMatch(project),true);assert.equal(e27Fit(p,b).valid,true);
const t=p.capRise/(p.height-5);assert.equal(radiusAt(p,t,0),p.capDiameter/2);assert.equal(radiusAt(p,0,0),p.diameter/2);assert.equal(radiusAt(p,1,0),p.topDiameter/2);
assert.ok(radiusAt({...p,capRoundness:100},.5,0)>radiusAt({...p,capRoundness:0},.5,0));
assert.equal(applyParameterPatch(p,{diameter:250}).capDiameter,260);
for(const patch of [{capDiameter:100},{capRise:40},{capRoundness:101}])assert.throws(()=>validateParams({...p,...patch}));
for(const patch of [{e27Enabled:'true'},{shape:'square'},{height:30},{e27Ring:42},{e27Ring:75,topDiameter:60,diameter:60},{socketDiameter:0},{e27Depth:240},{e27Deck:9}])assert.throws(()=>validateBase({...b,...patch}));
assert.equal(patchBase(b,{height:80}).e27Depth,65);assert.equal(validateBase(BASE_DEFAULTS).e27Enabled,false);
const checkBase=(mesh,q)=>{
 const plate=e27PlateZ(q),r=e27Opening(q)/2;
 assert.deepEqual(zHits(mesh,r-1,.13).filter(z=>z<q.height-5),[],'open holder aperture through the clamping deck');
 const hits=zHits(mesh,r+1,.13).filter(z=>z<q.height-5);assert.deepEqual(hits,[plate-q.e27Deck,plate],'deck thickness exports exactly');
 for(let k=0;k<3;k++){const a=k*2*Math.PI/3,cx=(q.topDiameter/2-7)*Math.cos(a),cy=(q.topDiameter/2-7)*Math.sin(a),hits=zHits(mesh,cx+.08,cy+.07);assert.ok(hits.includes(q.height-3.3),'closed pocket floor');assert.ok(hits.includes(q.height-5),'1.7 mm solid backing below pocket');assert.equal(hits.at(-1),q.height-3.3,'pocket opens only at top');
  const verts=[];for(let i=0;i<mesh.positions.length;i+=3)if(Math.abs(mesh.positions[i+2]-(q.height-3.3))<1e-4&&Math.hypot(mesh.positions[i]-cx,mesh.positions[i+1]-cy)<4.16)verts.push([mesh.positions[i],mesh.positions[i+1]]);
  for(const axis of [0,1])assert.ok(Math.abs(Math.max(...verts.map(v=>v[axis]))-Math.min(...verts.map(v=>v[axis]))-8.3)<.00005,'pocket diameter 8.3');
 }
 assert.deepEqual(zHits(mesh,0,0),[],'open underside service access and top ventilation');
 const nearFoot=[];for(let i=0;i<mesh.positions.length;i+=3)if(mesh.positions[i]<-q.diameter/2+q.e27Wall+.01&&Math.abs(mesh.positions[i+1])<.001)nearFoot.push(mesh.positions[i+2]);assert.ok(Math.min(...nearFoot)>=q.e27CableHeight-1e-4,'cable exit lifts the rear bottom rim');
};
let exports=0;
for(const patch of [{},{texture:'fluted',textureDepth:1,textureCount:16},{texture:'clay',clayDepth:.8,capRoundness:70},{capRise:4,capDiameter:280,lockTop:true}]){const s=validateParams({...p,...patch}),m=parseSTL(createBinarySTL(s));assert.ok(inspectModel({...m,params:s,pockets:[]}).valid);measureRecesses(m,s);exports++;}
for(const patch of [{},{texture:'clay',clayDepth:.8},{texture:'fluted',textureDepth:1},{profile:'tapered',diameter:140,height:160,e27Depth:50},{height:45,e27Depth:20,e27Deck:3,e27CableHeight:4}]){const q=validateBase({...b,...patch}),mesh=parseSTL(createBinarySTL(q));assert.ok(inspectModel({...mesh,params:q,pockets:[]}).valid,'hollow E27 STL manifold');checkBase(mesh,q);exports++;}
assert.equal(e27Fit(p,{...b,e27BulbDiameter:90}).valid,false);assert.equal(e27Fit(p,{...b,e27BulbHeight:140,e27HolderHeight:70,e27Depth:12}).valid,false);
const model=assembleLamp(project),withHardware=assembleLamp(project,0,{segments:192,layers:80,pocketSegments:64},true);assert.equal(model.parts.hardware,null);assert.ok(withHardware.parts.hardware);assert.equal(withHardware.parts.shadeZ,b.height);assert.ok(withHardware.indices.length>model.indices.length);assert.deepEqual(withHardware.parts.base.params,b);assert.deepEqual(new Uint8Array(createBinarySTL(b)),new Uint8Array(createBinarySTL(withHardware.parts.base.params)),'reference hardware never enters base STL');
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};restoreProject(storage,project);assert.deepEqual(currentProject(storage),project);assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))),project);
const low=assembleLamp(project,0,{segments:96,layers:64,pocketSegments:32});writeFileSync('.sites-runtime/mushroom-preview.json',JSON.stringify({positions:[...low.positions],indices:[...low.indices]}));
console.log(`PASS: ${exports} reimported watertight STLs, mushroom profile controls, exact closed magnet pockets and 1.7 mm E27 backing, integrated holder deck/aperture, underside access/cable notch, collision rejection, saved project round trip and hardware excluded from exports.`);
