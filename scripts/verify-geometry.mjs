import assert from 'node:assert/strict';
import {SCULPTURE_PRESETS} from '../lib/sculpture-presets.mjs';
import {analyzePrint,fitShadeToVolume} from '../lib/print-analysis.mjs';
import {writeFileSync} from 'node:fs';
import {createSTLResponse,stlDownloadUrl,stlFilename,EXPORT_RESOLUTION,createBinarySTL} from '../lib/stl-download.mjs';
import {DEFAULTS,SHAPES,TEXTURES,PRESETS,generateModel,inspectModel,toBinarySTL,validateParams,maxSocketDiameter,applyParameterPatch,sectionScale,radiusAt} from '../lib/model.mjs';

import {parseSTL,measureRecesses} from './geometry-checks.mjs';
let checked=0;
for(const shape of SHAPES)for(const texture of TEXTURES){const p={...DEFAULTS,...PRESETS[shape],shape,texture,...(texture==='woven'?{weaveColumns:24,weaveRows:12}:{})};const m=generateModel(p,{segments:192,layers:64,pocketSegments:64});const report=inspectModel(m);assert.equal(report.valid,true,`${shape}/${texture}: ${JSON.stringify(report)}`);checked++;}
for(const patch of [{height:60,diameter:60,topDiameter:30,curve:-30,wall:5,twist:180,textureDepth:6,textureCount:96,stripeDepth:6,stripeCount:64,waveDepth:10,waveCount:12,waveAround:16,socketDiameter:32},{socketDiameter:250,height:400,diameter:300,topDiameter:300,curve:60,twist:-180,texture:'diamond',waveDepth:10,stripeDepth:6}]){const m=generateModel({...DEFAULTS,...patch});assert.equal(inspectModel(m).valid,true);checked++;}
for(const patch of [{height:0},{diameter:NaN},{shape:'missing'},{textureCount:3.5},{magnetDepth:5},{socketDiameter:180},{diameter:60,socketDiameter:40}])assert.throws(()=>validateParams({...DEFAULTS,...patch}));
assert.equal(applyParameterPatch(DEFAULTS,{diameter:60}).socketDiameter,32);assert.equal(maxSocketDiameter({...DEFAULTS,depthRatio:70}),98);
 const exported=[];
for(const p of [DEFAULTS,{...DEFAULTS,...PRESETS.vase,shape:'vase',texture:'diamond',twist:90,stripeDepth:3,stripeCount:32,waveDepth:4,waveCount:5},{...DEFAULTS,height:60,diameter:60,topDiameter:30,wall:5,curve:-30,socketDiameter:32},{...DEFAULTS,...PRESETS.cube,shape:'cube',socketDiameter:42},{...DEFAULTS,...PRESETS.cube,shape:'cube',depthRatio:70,socketDiameter:70},{...DEFAULTS,...PRESETS.pyramid,shape:'pyramid',socketDiameter:28},{...DEFAULTS,...PRESETS.oval,shape:'oval',socketDiameter:80}]){
 const m=generateModel(p,EXPORT_RESOLUTION),bin=toBinarySTL(m),parsed=parseSTL(bin),report=inspectModel({...m,...parsed});assert.equal(report.valid,true,'re-imported STL is watertight, outward wound, and nondegenerate');const recesses=measureRecesses(parsed,p);if(p.shape==='cube'&&p.depthRatio===100){let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;for(let i=0;i<parsed.positions.length;i+=3){xmin=Math.min(xmin,parsed.positions[i]);xmax=Math.max(xmax,parsed.positions[i]);ymin=Math.min(ymin,parsed.positions[i+1]);ymax=Math.max(ymax,parsed.positions[i+1]);}assert.equal(xmax-xmin,160);assert.equal(ymax-ymin,160);}exported.push({shape:p.shape,socketDiameter:p.socketDiameter,height:p.height,triangles:report.triangles,bytes:bin.byteLength,recesses});
}
const lockedTopExports=[];
assert.throws(()=>validateParams({...DEFAULTS,lockTop:'true'}));
for(const shape of ['bell','cube','rounded-square']){
 const p={...DEFAULTS,...PRESETS[shape],shape,lockTop:true,topDiameter:84,depthRatio:85,twist:87,texture:'diamond',textureDepth:4,stripeDepth:3,waveDepth:6,socketDiameter:32};
 const originalRadius=p.topDiameter/2*sectionScale(p,0);
 assert.equal(radiusAt(p,1,0),originalRadius,'locked rim keeps its original profile');
 assert.notEqual(radiusAt({...p,lockTop:false},1,0),originalRadius,'unlocking restores body edits at the rim');
 const m=generateModel(p,EXPORT_RESOLUTION),parsed=parseSTL(toBinarySTL(m));
 assert.equal(inspectModel({...m,...parsed}).valid,true,'locked-top STL stays watertight');
 let topVertices=0;
 for(let i=0;i<parsed.positions.length;i+=3){const x=parsed.positions[i],y=parsed.positions[i+1],z=parsed.positions[i+2];if(z!==p.height)continue;topVertices++;const scale=sectionScale(p,Math.atan2(y,x)),r=Math.hypot(x,y)/scale;assert.ok(Math.min(Math.abs(r-p.topDiameter/2),Math.abs(r-(p.topDiameter/2-p.wall)))<.00003,'exported outer and inner rim keep the original outline');}
 assert.ok(topVertices>=EXPORT_RESOLUTION.segments*2);
 lockedTopExports.push({shape,topVertices,recesses:measureRecesses(parsed,p)});
}
function radialHits(mesh,angle,z,slope=0){
 const v=mesh.positions,f=mesh.indices,d=[Math.cos(angle),Math.sin(angle),slope],hits=[];
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 for(let i=0;i<f.length;i+=3){const a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3,e1=[v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],e2=[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]],h=cross(d,e2),det=dot(e1,h);if(Math.abs(det)<1e-10)continue;const q=[-v[a],-v[a+1],z-v[a+2]],u=dot(q,h)/det;if(u<0||u>1)continue;const r=cross(q,e1),w=dot(d,r)/det;if(w<0||u+w>1)continue;const t=dot(e2,r)/det;if(t>1e-6)hits.push(t);}
 return [...new Set(hits.map(t=>Math.round(t*1e4)/1e4))].sort((a,b)=>a-b);
}
const meshExports=[];
for(const patch of [{shape:'bell',meshColumns:32,meshRows:20,meshOpening:70},{...PRESETS['rounded-square'],shape:'rounded-square',lockTop:true,twist:87,meshColumns:24,meshRows:14,meshOpening:85},{height:60,diameter:60,topDiameter:30,socketDiameter:32,meshColumns:64,meshRows:48,meshOpening:25}]){
 const p={...DEFAULTS,...patch,texture:'mesh'},m=generateModel(p,EXPORT_RESOLUTION),parsed=parseSTL(toBinarySTL(m));
 assert.equal(inspectModel({...m,...parsed}).valid,true,'mesh STL is a manifold solid lattice');
 assert.equal(m.meshOpenings.length,p.meshColumns*p.meshRows);
 for(const hole of [m.meshOpenings[0],m.meshOpenings[Math.floor(m.meshOpenings.length/2)],m.meshOpenings.at(-1)]){
  assert.deepEqual(radialHits(parsed,hole.angle,hole.height),[],'mesh opening passes fully through the exported wall');
  assert.ok(radialHits(parsed,hole.boundaryAngle,hole.height).length>=2,'lattice bars remain solid next to each opening');
 }
 meshExports.push({shape:p.shape,openings:m.meshOpenings.length,recesses:measureRecesses(parsed,p)});
}
const wovenExports=[];
for(const patch of [{weaveOpen:true,twist:0},{weaveOpen:false,weaveColumns:32,weaveRows:24},{...PRESETS['rounded-square'],shape:'rounded-square',lockTop:true,weaveColumns:32,weaveRows:16,weaveOpen:true,twist:90}]){
 const p={...DEFAULTS,...patch,texture:'woven'},m=generateModel(p,EXPORT_RESOLUTION),parsed=parseSTL(toBinarySTL(m));
 assert.equal(inspectModel({...m,...parsed}).valid,true,'stacked-band STL stays manifold');
 assert.equal(m.meshOpenings.length,0,'no artificial diamond perforations');
 assert.equal(m.wavyBands,p.weaveRows);
 if(p.weaveOpen){
  assert.ok(m.wavySlots.length>0,'alternating bands form gaps');
  for(const slot of [m.wavySlots[0],m.wavySlots[Math.floor(m.wavySlots.length/2)],m.wavySlots.at(-1)]){
   const slope=slot.outwardAbove?-.001:.001,center=(slot.innerRadius+slot.outerRadius)/2;
   assert.deepEqual(radialHits(parsed,slot.angle,slot.height-slope*center,slope),[],'light path through the gap between solid bands');
  }
 }else assert.ok(radialHits(parsed,.3,p.height*.5).length>=2,'closed weave has a solid wall');
 if(p.shape==='bell'&&p.weaveOpen){
  for(const row of [20,21]){
   const z=19+(row+.5)*(p.height-33)/p.weaveRows;
   const hits=radialHits(parsed,0,z),baseline=radiusAt({...p,texture:'smooth'},(z-5)/(p.height-5),0)-p.wall/2;
   assert.equal(hits.length,2,'each wavy row is one continuous solid line');
   assert.ok(Math.abs(hits[1]-hits[0]-p.weaveStrand)<.001,'line width matches control');
   assert.ok(Math.abs((hits[0]+hits[1])/2-baseline-(row%2?-1:1)*p.weaveDepth/2)<.01,'rows alternate the corrugation phase');
  }
 }
 wovenExports.push({shape:p.shape,openWeave:p.weaveOpen,bands:m.wavyBands,gapSamples:m.wavySlots.length,recesses:measureRecesses(parsed,p)});
}
const extentExports=[];
for(const patch of [{texture:'woven',smoothBottom:1,smoothTop:0},{texture:'woven',smoothBottom:60,smoothTop:70},{texture:'mesh',smoothBottom:1,smoothTop:0},{texture:'woven',smoothBottom:1,smoothTop:0,shape:'rounded-square',lockTop:true}]){
 const p={...DEFAULTS,weaveColumns:32,weaveRows:24,...patch},m=generateModel(p,EXPORT_RESOLUTION),parsed=parseSTL(toBinarySTL(m));
 assert.equal(inspectModel({...m,...parsed}).valid,true,'changed smooth extents export a manifold solid');
 if(p.texture==='woven'){
  const pitch=(p.height-5-p.smoothBottom-p.smoothTop)/p.weaveRows;
  assert.ok(radialHits(parsed,.137,5+p.smoothBottom/2).length>=2,'lower smooth collar remains solid');
  if(p.smoothTop)assert.ok(radialHits(parsed,.137,p.height-p.smoothTop/2).length>=2,'upper smooth collar remains solid');
  assert.ok(m.wavySlots.some(slot=>Math.abs(slot.height-(5+p.smoothBottom+pitch))<.00001),'woven bands begin at the selected extent');
  if(p.lockTop)for(let i=0;i<parsed.positions.length;i+=3){const x=parsed.positions[i],y=parsed.positions[i+1],z=parsed.positions[i+2];if(z!==p.height)continue;const r=Math.hypot(x,y)/sectionScale(p,Math.atan2(y,x));assert.ok(Math.min(Math.abs(r-p.topDiameter/2),Math.abs(r-(p.topDiameter/2-p.wall)))<.00003,'top lock still preserves original outline at zero smooth area');}
 }else for(const hole of [m.meshOpenings[0],m.meshOpenings.at(-1)]){assert.ok(hole.height>5+p.smoothBottom&&hole.height<p.height-p.smoothTop);assert.deepEqual(radialHits(parsed,hole.angle,hole.height),[]);}
 extentExports.push({...patch,recesses:measureRecesses(parsed,p)});
}
assert.throws(()=>validateParams({...DEFAULTS,height:60,smoothTop:80}));
assert.equal(applyParameterPatch({...DEFAULTS,smoothBottom:80,smoothTop:80},{height:60}).smoothTop,26);
const extentParams={...DEFAULTS,texture:'fluted',smoothBottom:20,smoothTop:30,twist:0};
for(const z of [10,180])assert.equal(radiusAt(extentParams,(z-5)/195,0),radiusAt({...extentParams,texture:'smooth'},(z-5)/195,0),'smooth regions exclude surface relief');
assert.ok(radiusAt(extentParams,.5,0)>radiusAt({...extentParams,texture:'smooth'},.5,0),'body keeps selected texture');
assert.throws(()=>validateParams({...DEFAULTS,weaveOpen:'yes'}));
const sculptureExports=[];
for(const study of SCULPTURE_PRESETS){const p={...DEFAULTS,...study.params},m=generateModel(p,EXPORT_RESOLUTION),parsed=parseSTL(toBinarySTL(m));assert.ok(inspectModel({...m,...parsed}).valid,`${study.name} exports a manifold solid`);sculptureExports.push({name:study.name,size:analyzePrint(m,[256,256,256]).size,recesses:measureRecesses(parsed,p)});}
for(const texture of ['pleated','rings','mesh','woven']){
 const p={...DEFAULTS,texture,shape:'stacked',leanX:60,leanY:-60,asymmetricBulge:40,bulgePosition:25,bulgeDirection:80,lobeDepth:12,lobeCount:5,bulgeDepth:35,stackCount:3,weaveColumns:24,weaveRows:12,lockTop:true,smoothTop:0};
 const m=generateModel(p,EXPORT_RESOLUTION),parsed=parseSTL(toBinarySTL(m));assert.ok(inspectModel({...m,...parsed}).valid,'combined asymmetric edits stay manifold after STL export');measureRecesses(parsed,p);
 const centered=generateModel({...p,leanX:0,leanY:0},EXPORT_RESOLUTION);
 for(let i=0;i<m.positions.length;i+=3){const z=m.positions[i+2];if(z<=19)for(let k=0;k<3;k++)assert.equal(m.positions[i+k],centered.positions[i+k],'lower mounting collar and pockets never move');if(z===p.height){assert.ok(Math.abs(m.positions[i]-centered.positions[i]-60)<.00003);assert.ok(Math.abs(m.positions[i+1]-centered.positions[i+1]+60)<.00003);}}
}
const denseWoven=generateModel({...DEFAULTS,texture:'woven',shape:'stacked',leanX:60,leanY:-60,lobeDepth:12,asymmetricBulge:40,weaveColumns:128,weaveRows:96},EXPORT_RESOLUTION);
assert.ok(inspectModel(denseWoven).valid,'highest-density shaped weave has no sliver or degenerate triangles');
const oversized={...DEFAULTS,...SCULPTURE_PRESETS.at(-1).params,height:400,diameter:300,topDiameter:200,bulgeDepth:60,socketDiameter:42};
assert.equal(analyzePrint(generateModel(oversized),[200,200,250]).fits,false);
const fitted=fitShadeToVolume(oversized,[200,200,250]),fitModel=generateModel(fitted,EXPORT_RESOLUTION);
assert.equal(analyzePrint(fitModel,[200,200,250]).fits,true,'fit action uses the actual exported model bounds');assert.ok(inspectModel(fitModel).valid);measureRecesses(parseSTL(toBinarySTL(fitModel)),fitted);
const offCenter={...DEFAULTS,asymmetricBulge:20,bulgeDirection:0,bulgePosition:50};assert.ok(radiusAt(offCenter,.5,0)>radiusAt(offCenter,.5,Math.PI)+19,'fullness affects the selected side');
const downloadParams={...DEFAULTS,...PRESETS.vase,shape:'vase',texture:'diamond',height:241,twist:90,stripeDepth:3,waveDepth:4};
const response=createSTLResponse(new Request('https://test.local'+stlDownloadUrl(downloadParams)));
assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'application/octet-stream');assert.equal(response.headers.get('Content-Disposition'),`attachment; filename="${stlFilename(downloadParams)}"`);
const delivered=await response.arrayBuffer(),expected=generateModel(downloadParams,EXPORT_RESOLUTION),received=parseSTL(delivered);
assert.equal(delivered.byteLength,Number(response.headers.get('Content-Length')));
assert.deepEqual(new Uint8Array(delivered),new Uint8Array(createBinarySTL(downloadParams)),'HTTP attachment must match the current edited model');
assert.equal(inspectModel({...expected,...received}).valid,true);
const deliveredRecesses=measureRecesses(received,downloadParams);
assert.equal(createSTLResponse(new Request('https://test.local/api/export-stl?model=%7B%22height%22%3A0%7D')).status,400);
assert.equal(createSTLResponse(new Request('https://test.local/api/export-stl')).status,400);
const result={sculptureExports,fitToVolume:{status:'passed',size:analyzePrint(fitModel,[200,200,250]).size},extentExports,wovenExports,meshExports,lockedTopExports,httpDownload:{status:'passed',bytes:delivered.byteLength,filename:stlFilename(downloadParams),recesses:deliveredRecesses},status:'passed' ,parameterCases:checked,invalidInputsRejected:7,stlExports:exported};writeFileSync('.sites-runtime/geometry-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
