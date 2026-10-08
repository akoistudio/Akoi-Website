import {e27Hardware} from './e27-fit.mjs';
import {Color} from 'three';
import {generateModel} from './model.mjs';
import {generateDiffuser} from './diffuser-model.mjs';
import {generateLid} from './lid-model.mjs';
import {generateBase} from './base-model.mjs';
import {validateProject} from './design-project.mjs';
export function assembleLamp(input,gap=0,options={segments:192,layers:80,pocketSegments:64},showHardware=false){
 const project=validateProject(input);if(!Number.isFinite(gap)||gap<0||gap>100)throw new Error('Assembly spacing must be 0–100 mm.');
 const cache=options.cache;
 const part=(kind,params,build)=>{if(!cache)return build();const key=JSON.stringify(params),entry=cache[kind];if(entry?.key===key)return entry.model;const model=build();cache[kind]={key,model};return model;};
 const shade=part('shade',project.shade,()=>generateModel(project.shade,options)),base=part('base',project.base,()=>generateBase(project.base,options));
 const offset=project.base.height+gap,lid=project.lidEnabled?part('lid',project.lid,()=>generateLid(project.lid,options)):null,lidZ=offset+project.shade.height-project.lid.grooveDepth+gap;
 const diffuser=project.diffuserEnabled?part('diffuser',project.diffuser,()=>generateDiffuser(project.diffuser,options)):null;
 const hardware=showHardware&&project.base.e27Enabled?part('hardware',project.base,()=>e27Hardware(project.base)):null;
 const parts=[...(hardware?[{model:hardware,z:0,color:'#ded8bd'}]:[]),...(diffuser?[{model:diffuser,z:offset+5+gap,color:project.finishes.diffuser}]:[]),{model:shade,z:offset,color:project.finishes.shade},{model:base,z:0,color:project.finishes.base},...(lid?[{model:lid,z:lidZ,x:project.shade.leanX,y:project.shade.leanY,color:project.finishes.lid}]:[])];
 const positions=new Float32Array(parts.reduce((sum,part)=>sum+part.model.positions.length,0)),colors=new Float32Array(positions.length),indices=new Uint32Array(parts.reduce((sum,part)=>sum+part.model.indices.length,0));
 let po=0,io=0,width=0;
 for(const part of parts){const m=part.model,c=new Color(part.color);positions.set(m.positions,po);for(let i=0;i<m.positions.length;i+=3){positions[po+i]+=part.x??0;positions[po+i+1]+=part.y??0;positions[po+i+2]+=part.z;colors.set([c.r,c.g,c.b],po+i);width=Math.max(width,2*Math.abs(positions[po+i]),2*Math.abs(positions[po+i+1]));}for(let i=0;i<m.indices.length;i++)indices[io+i]=m.indices[i]+po/3;po+=m.positions.length;io+=m.indices.length;}
 return {positions,indices,colors,params:{kind:'assembly',height:lid?lidZ+project.lid.height:project.shade.height+offset,diameter:width,topDiameter:width,depthRatio:100},pockets:[],parts:{shade,base,lid,diffuser,hardware,diffuserZ:offset+5+gap,shadeZ:offset,lidZ},project};
}
export function mountingMatch(project){
 const p=validateProject(project),a=p.shade,b=p.base;
 const shape=['cube','pyramid'].includes(a.shape)?'square':a.shape==='hexagon'?'hexagon':a.shape==='rounded-square'?'rounded-square':a.depthRatio!==100?'oval':'circle';
 return b.shape===shape&&b.topDiameter===a.diameter&&b.depthRatio===a.depthRatio&&b.magnetRecesses;
}
