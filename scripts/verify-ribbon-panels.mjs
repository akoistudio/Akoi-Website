import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {DEFAULTS,generateModel,validateParams,applyParameterPatch,radiusAt,inspectModel} from '../lib/model.mjs';
import {SCULPTURE_PRESETS} from '../lib/sculpture-presets.mjs';
import {panelRibPattern,maxPanelRibs,panelResolution} from '../lib/flowing-folds.mjs';
import {createBinarySTL} from '../lib/stl-download.mjs';
import {BASE_DEFAULTS} from '../lib/base-model.mjs';
import {validateProject,currentProject,restoreProject} from '../lib/design-project.mjs';
import {parseSTL,measureRecesses} from './geometry-checks.mjs';
const p=validateParams({...DEFAULTS,...SCULPTURE_PRESETS.find(s=>s.name==='Ribbon spiral').params});
for(const t of [.15,.5,.85]){
 const center=p.foldRotation*Math.PI/180*t+p.panelOffset*Math.PI/180/p.foldCount,span=2*Math.PI/p.foldCount,width=p.panelCoverage/100;
 assert.equal(panelRibPattern(p,t,center+span*.49),0,'smooth ribbons contain no ribs');
 const baseline={...p,texture:'smooth'},a=center+span*.49;assert.equal(radiusAt(p,t,a),radiusAt(baseline,t,a),'smooth ribbon has identical actual geometry to the untextured body');
 let peaks=0,previous=-1;const steps=p.panelRibCount*64;const vals=[];for(let i=0;i<=steps;i++)vals.push(panelRibPattern(p,t,center+span*width*(i/steps-.5)));
 for(let i=1;i<steps;i++)if(vals[i]>vals[i-1]&&vals[i]>vals[i+1])peaks++;assert.equal(peaks,p.panelRibCount,'requested rib count exists inside each panel');
 const aRib=center+span*width*(.5/p.panelRibCount-.5);assert.ok(radiusAt(p,t,aRib)>radiusAt(baseline,t,aRib),'ribs are real exported surface relief');
 assert.equal(panelRibPattern(p,t,center+span*width/2),0,'panel edge meets smooth surface');
 for(const a of [.13,1.78,4.22])assert.ok(Math.abs(panelRibPattern(p,t,a)-panelRibPattern(p,t,a+2*Math.PI))<1e-8,'angular seam is continuous');
}
const mismatchedTwist={...p,twist:-150};assert.equal(panelRibPattern(mismatchedTwist,.5,.37),panelRibPattern(p,.5,.37),'rib alignment follows fold rotation automatically');
assert.equal(maxPanelRibs({...p,foldCount:8,panelCoverage:25}),8);assert.ok(panelResolution(p,384)>=Math.ceil(3*18/.65*6));
const adjusted=applyParameterPatch(p,{foldCount:8,panelCoverage:25});assert.equal(adjusted.panelRibCount,8,'editing folds keeps rib density valid');assert.throws(()=>validateParams({...adjusted,panelRibCount:24}));assert.throws(()=>validateParams({...p,panelRibs:'yes'}));
for(const patch of [{},{panelCoverage:90,panelRibCount:24,panelEdge:0,panelOffset:360,foldRotation:-180},{foldCount:8,panelCoverage:25,panelRibCount:8,panelEdge:25,foldWaist:25},{panelRibs:false},{panelOffset:180,foldTopBlend:0,lockTop:true}]){
 const s=validateParams({...p,...patch}),mesh=parseSTL(createBinarySTL(s));assert.ok(inspectModel({...mesh,params:s,pockets:[]}).valid,'panelled export is watertight, consistently wound, nondegenerate');measureRecesses(mesh,s);
}
const project=validateProject({format:'akoi-design',version:1,shade:p,base:BASE_DEFAULTS}),map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};restoreProject(storage,JSON.parse(JSON.stringify(project)));assert.deepEqual(currentProject(storage),project,'save/import retains every panel and waist control');
const old={...p};for(const k of ['foldWaist','panelRibs','panelCoverage','panelRibCount','panelOffset','panelEdge'])delete old[k];assert.equal(validateParams(old).panelRibs,false,'old saved designs keep uniform textures');
const model=generateModel(p,{segments:768,layers:96,pocketSegments:32});writeFileSync(new URL('../.sites-runtime/ribbon-preview.json',import.meta.url),JSON.stringify({positions:[...model.positions],indices:[...model.indices]}));
console.log('PASS: measured panel rib count, genuinely smooth ribbons, automatically aligned spiral ribs, continuous panel boundaries/seam, adaptive rib sampling and density constraints, 5 watertight STL exports with 3 blind magnet recesses, and old/new project round trips.');
