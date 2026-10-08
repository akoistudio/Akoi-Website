import {generateModel} from './model.mjs';
import {generateBase} from './base-model.mjs';
import {generateLid} from './lid-model.mjs';
import {layeredShade,diffuserFit} from './diffuser-model.mjs';
import {e27Fit} from './e27-fit.mjs';
import {assembleLamp} from './assembly.mjs';

export const PREVIEW_RESOLUTION=Object.freeze({segments:192,layers:64,pocketSegments:64,preview:true});
// One entry per part; finish/spacing changes reuse geometry in the same worker.
export function createPreviewBuilder(){
 const cache={};
 const part=(kind,params,build)=>{const key=JSON.stringify(params);if(cache[kind]?.key===key)return cache[kind].model;const model=build();cache[kind]={key,model};return model;};
 return (kind,input)=>{
  if(kind==='shade')return part('shade',input,()=>generateModel(input,PREVIEW_RESOLUTION));
  if(kind==='base')return part('base',input,()=>generateBase(input,PREVIEW_RESOLUTION));
  if(kind==='lid')return part('lid',input,()=>generateLid(input,PREVIEW_RESOLUTION));
  if(kind==='layered')return layeredShade(part('shade',input.shade,()=>generateModel(input.shade,PREVIEW_RESOLUTION)),input.diffuser,input.mode,input.color);
  if(kind==='assembly')return assembleLamp(input.project,input.gap,{...PREVIEW_RESOLUTION,cache},input.showHardware);
  if(kind==='diffuser-fit')return diffuserFit(input.diffuser,input.shade);
  if(kind==='e27-fit')return e27Fit(input.shade,input.base);
  throw new Error('Unknown preview operation.');
 };
}
