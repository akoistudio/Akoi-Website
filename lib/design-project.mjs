import {DEFAULTS,validateParams} from './model.mjs';
import {DIFFUSER_DEFAULTS,validateDiffuser} from './diffuser-model.mjs';
import {LID_DEFAULTS,validateLid} from './lid-model.mjs';
import {BASE_DEFAULTS,validateBase} from './base-model.mjs';
export function validateProject(input){
 if(!input||input.format!=='akoi-design'||input.version!==1)throw new Error('Choose an AKŌI project (.akoi.json). STL meshes do not contain editable design parameters.');
 const shade=validateParams(input.shade),base=validateBase(input.base),diffuser=validateDiffuser(input.diffuser??DIFFUSER_DEFAULTS),diffuserEnabled=input.diffuserEnabled??false;if(typeof diffuserEnabled!=='boolean')throw new Error('Diffuser visibility must be true or false.');
 const lid=validateLid(input.lid??LID_DEFAULTS),lidEnabled=input.lidEnabled??false;if(typeof lidEnabled!=='boolean')throw new Error('Lid visibility must be true or false.');
 const finishes={diffuser:input.finishes?.diffuser??'#f4eddf',lid:input.finishes?.lid??'#c9bda5',shade:input.finishes?.shade??'#c9bda5',base:input.finishes?.base??'#74513d'};
 for(const color of Object.values(finishes))if(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))throw new Error('Invalid preview color.');
 return {format:'akoi-design',version:1,shade,base,lid,lidEnabled,diffuser,diffuserEnabled,finishes};
}
export function currentProject(storage){
 const read=(key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback;}catch{return fallback;}};
 return validateProject({format:'akoi-design',version:1,diffuser:read('akoi-diffuser',DIFFUSER_DEFAULTS),diffuserEnabled:storage.getItem('akoi-diffuser-enabled')==='true',shade:read('akoi-shade',DEFAULTS),base:read('akoi-base',BASE_DEFAULTS),lid:read('akoi-lid',LID_DEFAULTS),lidEnabled:storage.getItem('akoi-lid-enabled')==='true',finishes:{diffuser:storage.getItem('akoi-diffuser-color')||'#f4eddf',lid:storage.getItem('akoi-lid-color')||'#c9bda5',shade:storage.getItem('akoi-shade-color')||'#c9bda5',base:storage.getItem('akoi-base-color')||'#74513d'}});
}
export function restoreProject(storage,input){const p=validateProject(input);storage.setItem('akoi-diffuser',JSON.stringify(p.diffuser));storage.setItem('akoi-diffuser-enabled',String(p.diffuserEnabled));storage.setItem('akoi-diffuser-color',p.finishes.diffuser);storage.setItem('akoi-lid',JSON.stringify(p.lid));storage.setItem('akoi-lid-enabled',String(p.lidEnabled));storage.setItem('akoi-lid-color',p.finishes.lid);storage.setItem('akoi-shade',JSON.stringify(p.shade));storage.setItem('akoi-base',JSON.stringify(p.base));storage.setItem('akoi-shade-color',p.finishes.shade);storage.setItem('akoi-base-color',p.finishes.base);return p;}
