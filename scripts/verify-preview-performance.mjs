import assert from 'node:assert/strict';
import {createPreviewBuilder,PREVIEW_RESOLUTION} from '../lib/preview-model.mjs';
import {DEFAULTS,generateModel,inspectModel} from '../lib/model.mjs';
import {BASE_DEFAULTS} from '../lib/base-model.mjs';
import {LID_DEFAULTS} from '../lib/lid-model.mjs';
import {mushroomProject} from '../lib/mushroom-project.mjs';

const build=createPreviewBuilder();
for(const texture of ['smooth','clay','fuzzy','mesh','woven']){
 const params={...DEFAULTS,texture,...(texture==='woven'?{weaveColumns:24,weaveRows:12}:{})};
 const model=build('shade',params);assert.equal(inspectModel(model).valid,true,`${texture} preview remains manifold`);
 assert.equal(build('shade',{...params}),model,'unchanged parameters reuse cached geometry');
 if(['clay','fuzzy'].includes(texture)){assert.ok(model.segments<=384);assert.ok(model.layers<=96);}
}
for(const [kind,input] of [['base',BASE_DEFAULTS],['lid',LID_DEFAULTS]])assert.ok(inspectModel(build(kind,input)).valid,`${kind} preview remains manifold`);
const project=mushroomProject(),cache={};
// Test the same bounded cache used by the worker, including spacing/color changes.
const {assembleLamp}=await import('../lib/assembly.mjs');
const original=assembleLamp(project,0,{...PREVIEW_RESOLUTION,cache},true),exploded=assembleLamp({...project,finishes:{...project.finishes,shade:'#343331'}},25,{...PREVIEW_RESOLUTION,cache},true);
assert.equal(original.parts.shade,exploded.parts.shade);assert.equal(original.parts.base,exploded.parts.base);assert.equal(original.parts.hardware,exploded.parts.hardware);
assert.equal(exploded.parts.shadeZ-original.parts.shadeZ,25);assert.notDeepEqual(original.colors,exploded.colors);
const changed=assembleLamp({...project,shade:{...project.shade,height:project.shade.height+1}},0,{...PREVIEW_RESOLUTION,cache},true);
assert.notEqual(changed.parts.shade,original.parts.shade);assert.equal(changed.parts.base,original.parts.base);
assert.equal(generateModel(DEFAULTS).params.height,DEFAULTS.height);
console.log('Preview checks passed: valid bounded meshes, parameter cache, assembly spacing/finish reuse and selective invalidation.');
