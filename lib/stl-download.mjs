import {validateParams,generateModel,toBinarySTL} from './model.mjs';
import {validateDiffuser,generateDiffuser} from './diffuser-model.mjs';
import {validateLid,generateLid} from './lid-model.mjs';
import {validateBase,generateBase} from './base-model.mjs';
const validateObject=input=>input?.kind==='diffuser'?validateDiffuser(input):input?.kind==='lid'?validateLid(input):input?.kind==='base'?validateBase(input):validateParams(input);

// Shared deterministic export used by the local worker and legacy file endpoint.
export const EXPORT_RESOLUTION = Object.freeze({segments:512,layers:160,pocketSegments:128});
export function createBinarySTL(input){const p=validateObject(input);return toBinarySTL(p.kind==='diffuser'?generateDiffuser(p,EXPORT_RESOLUTION):p.kind==='lid'?generateLid(p,EXPORT_RESOLUTION):p.kind==='base'?generateBase(p,EXPORT_RESOLUTION):generateModel(p,EXPORT_RESOLUTION));}
export function stlFilename(input){const p=validateObject(input);return `akoi-${p.kind==='diffuser'?'diffuser-':p.kind==='lid'?'lid-':p.kind==='base'?'base-':''}${p.kind==='diffuser'?'smooth':p.kind==='lid'?p.source.shape:p.shape}-${p.height}mm.stl`;}
export function stlDownloadUrl(input){const p=validateObject(input);return `/api/export-stl?model=${encodeURIComponent(JSON.stringify(p))}`;}
export function createSTLResponse(request){
 try{
  const url=new URL(request.url),raw=url.searchParams.get('model');
  if(!raw||raw.length>3000)throw new Error('A valid model is required. Return to the editor and export again.');
  const params=validateObject(JSON.parse(raw));
  const buffer=createBinarySTL(params);
  return new Response(buffer,{status:200,headers:{
   'Content-Type':'application/octet-stream',
   'Content-Disposition':`attachment; filename="${stlFilename(params)}"`,
   'Content-Length':String(buffer.byteLength),
   'Cache-Control':'private, no-store',
   'X-Content-Type-Options':'nosniff'
  }});
 }catch(error){return new Response(error instanceof Error?error.message:'The STL could not be created.',{status:400,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store'}});}
}
