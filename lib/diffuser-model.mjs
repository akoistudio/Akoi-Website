import {validateParams,radiusAt,sectionScale,topLockBlend} from './model.mjs';
import {Color} from 'three';
export const DIFFUSER_DEFAULTS={kind:'diffuser',diameter:96,height:180,wall:1.2,socketDiameter:42,flangeWidth:2,flangeThickness:1.6};
export const DIFFUSER_LIMITS={diameter:[30,240,.1],height:[20,350,1],wall:[.8,3,.1],socketDiameter:[10,220,.1],flangeWidth:[1,8,.1],flangeThickness:[1.2,5,.1]};
export function validateDiffuser(input={}){
 const p={...DIFFUSER_DEFAULTS,...input};if(p.kind!=='diffuser')throw new Error('Choose an inner diffuser.');
 for(const [k,[lo,hi,step]]of Object.entries(DIFFUSER_LIMITS))if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi||(step===1&&!Number.isInteger(p[k])))throw new Error(`${k} must be ${lo}–${hi}.`);
 for(const k of Object.keys(input))if(!(k in DIFFUSER_DEFAULTS))throw new Error(`Unknown diffuser setting: ${k}`);
 if(p.socketDiameter>p.diameter-2*p.wall-4)throw new Error('Reduce the socket opening or enlarge the diffuser to leave at least 2 mm of flange support inside the wall.');
 return p;
}
// A single watertight body of revolution: flange, socket bore, thin cylinder,
// open top. It is printed separately and rests on the shade's 5 mm bottom.
export function generateDiffuser(input,{segments=384}={}){
 const p=validateDiffuser(input),v=[],f=[];segments=Math.ceil(segments/24)*24;
 const outer=p.diameter/2,inner=outer-p.wall,edge=outer+p.flangeWidth,hole=p.socketDiameter/2;
 const profile=[[hole,0],[edge,0],[edge,p.flangeThickness],[outer,p.flangeThickness],[outer,p.height],[inner,p.height],[inner,p.flangeThickness],[hole,p.flangeThickness]];
 for(const [r,z]of profile)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;v.push(r*Math.cos(a),r*Math.sin(a),z);}
 for(let k=0;k<profile.length;k++){const next=(k+1)%profile.length;for(let i=0;i<segments;i++){const j=(i+1)%segments,a=k*segments+i,b=k*segments+j,c=next*segments+j,d=next*segments+i;f.push(a,b,c,a,c,d);}}
 return {positions:new Float32Array(v),indices:new Uint32Array(f),params:{...p,topDiameter:p.diameter,depthRatio:100},pockets:[]};
}
export function diffuserFit(input,shade){
 const p=validateDiffuser(input),s=validateParams(shade);let clearance=Infinity,insertion=Infinity;
 const cavity={...s,texture:['fuzzy','woven'].includes(s.texture)?'smooth':s.texture};
 // Conservative radial envelope, including angular relief, top lock and lean.
 for(let k=0;k<=240;k++){const z=5+(s.height-5)*k/240,t=(z-5)/(s.height-5),u=Math.max(0,Math.min(1,(z-19)/(s.height-19))),shift=Math.hypot(s.leanX,s.leanY)*u*u*(3-2*u);
  for(let i=0;i<384;i++){const angle=i/384*Math.PI*2,lock=topLockBlend(s,t),wall=s.wall*(sectionScale(s,angle-s.twist*Math.PI/180*t)*(1-lock)+sectionScale(s,angle)*lock),wovenAllowance=s.texture==='woven'?(s.weaveDepth/2+Math.max(0,(s.weaveOpen?s.weaveStrand:Math.max(s.weaveStrand,s.weaveDepth+.2))-s.wall)/2)*Math.max(sectionScale(s,angle),sectionScale(s,angle-s.twist*Math.PI/180*t)):0,r=radiusAt(cavity,t,angle)-wall-shift-wovenAllowance;
   const solidRadius=p.diameter/2+(z<=5+p.flangeThickness?p.flangeWidth:0);
   if(z<=5+p.height+.001)clearance=Math.min(clearance,r-solidRadius);
   insertion=Math.min(insertion,r-(p.diameter/2+p.flangeWidth));
  }
 }
 const issues=[];if(p.height>s.height-7)issues.push('Shorten the diffuser to leave at least 2 mm below the shade top.');if(clearance<1)issues.push('Leave at least 1 mm of space between the diffuser and shade.');if(insertion<.5)issues.push('Reduce diffuser diameter or flange width so it can pass through the shade opening.');if(p.socketDiameter<s.socketDiameter)issues.push('Match or enlarge the diffuser socket so it does not obstruct the shade opening.');
 return {valid:!issues.length,issues,clearance,insertion};
}
export function matchDiffuser(input,shade){
 const s=validateParams(shade);let p=validateDiffuser({...input,diameter:Math.max(input.diameter??96,s.socketDiameter+2*(input.wall??1.2)+4),height:Math.max(20,Math.min(input.height??180,s.height-10)),socketDiameter:s.socketDiameter});
 const fit=diffuserFit(p,s),shrink=Math.max(0,1.5-fit.clearance,.8-fit.insertion);p=validateDiffuser({...p,diameter:Math.floor((p.diameter-2*shrink)*10)/10});const checked=diffuserFit(p,s);if(!checked.valid)throw new Error(checked.issues.join(' '));return p;
}
export function layeredShade(outer,diffuser,mode='both',outerColor='#c9bda5',innerColor='#f4eddf'){
 const inner=generateDiffuser(diffuser,{segments:192}),parts=mode==='inner'?[{model:inner,z:5,color:innerColor}]:mode==='outer'?[{model:outer,z:0,color:outerColor}]:[{model:outer,z:0,color:outerColor},{model:inner,z:5,color:innerColor}];
 const positions=new Float32Array(parts.reduce((n,p)=>n+p.model.positions.length,0)),indices=new Uint32Array(parts.reduce((n,p)=>n+p.model.indices.length,0)),colors=new Float32Array(positions.length);let po=0,io=0;
 for(const part of parts){const c=new Color(part.color),m=part.model;positions.set(m.positions,po);for(let i=0;i<m.positions.length;i+=3){positions[po+i+2]+=part.z;colors.set([c.r,c.g,c.b],po+i);}for(let i=0;i<m.indices.length;i++)indices[io+i]=m.indices[i]+po/3;po+=m.positions.length;io+=m.indices.length;}
 return {positions,indices,colors,params:{...outer.params,kind:'layered'},pockets:[],outerIndexCount:mode==='both'?outer.indices.length:0};
}
