import {E27_DEFAULTS,E27_LIMITS,validateE27Base,generateE27Base} from './e27-base.mjs';
import {CLAY_DEFAULTS,CLAY_LIMITS,clayIndent,clayResolution,clayFade} from './clay-texture.mjs';
import {ShapeUtils,Vector2} from 'three';
import {fuzzyRelief,fuzzyResolution} from './fuzzy-texture.mjs';
import {sectionScale,BASE} from './model.mjs';
export const BASE_SHAPES=['circle','rounded-square','square','hexagon','oval'];
export const BASE_PROFILES=['straight','tapered','pedestal'];
export const BASE_TEXTURES=['smooth','fluted','pleated','wave','fuzzy','clay'];
export const BASE_DEFAULTS={...E27_DEFAULTS,...CLAY_DEFAULTS,kind:'base',shape:'circle',profile:'tapered',texture:'smooth',height:30,diameter:190,topDiameter:180,depthRatio:100,socketDiameter:42,magnetRecesses:true,textureDepth:1.5,textureCount:48,twist:0,wall:0,fuzzyDepth:.35,fuzzySpacing:1.5,fuzzyStretch:3,fuzzySeed:17};
export const BASE_LIMITS={...E27_LIMITS,...CLAY_LIMITS,height:[6,300,1],diameter:[60,300,1],topDiameter:[60,300,1],depthRatio:[50,180,1],socketDiameter:[0,272,.1],textureDepth:[0,5,.1],textureCount:[8,96,1],twist:[-90,90,1],fuzzyDepth:[0,1,.05],fuzzySpacing:[.8,4,.1],fuzzyStretch:[1,8,1],fuzzySeed:[0,9999,1]};
export function baseSocketMax(p){return Math.floor((p.topDiameter*Math.min(1,p.depthRatio/100)-28)*10+1e-8)/10;}
export function validateBase(input){
 const p={...BASE_DEFAULTS,...input};
 if(p.kind!=='base'||!BASE_SHAPES.includes(p.shape)||!BASE_PROFILES.includes(p.profile)||!BASE_TEXTURES.includes(p.texture))throw new Error('Choose a supported base shape, profile and texture.');
 if(typeof p.magnetRecesses!=='boolean')throw new Error('Magnet recesses must be enabled or disabled.');
 for(const [key,[min,max,step]]of Object.entries(BASE_LIMITS)){if(!Number.isFinite(p[key])||p[key]<min||p[key]>max||(step===1&&!Number.isInteger(p[key])))throw new Error(`${key} must be ${min}–${max}.`);}
 if(p.profile==='straight'&&p.diameter!==p.topDiameter)throw new Error('Straight profile needs matching foot and mounting widths.');
 if(p.diameter<p.topDiameter)throw new Error('Foot width must be at least the mounting width.');
 if(p.topDiameter*Math.min(1,p.depthRatio/100)<38)throw new Error('The mounting outline must be at least 38 mm deep.');
 if(p.socketDiameter>baseSocketMax(p))throw new Error('The opening must leave 14 mm of mounting rim.');
 if(p.socketDiameter>0&&p.socketDiameter<10)throw new Error('Use 0 for a closed center, or at least 10 mm for an opening.');
 validateE27Base(p);
 for(const key of Object.keys(input))if(!(key in BASE_DEFAULTS))throw new Error(`Unknown base parameter: ${key}`);
 return p;
}
export function patchBase(current,patch){const p={...current,...patch};if(p.e27Enabled&&('height'in patch)&&!('e27Depth'in patch))p.e27Depth=Math.max(12,Math.min(p.e27Depth,p.height-p.e27Deck-p.e27CableHeight-2));p.depthRatio=Math.max(p.depthRatio,Math.ceil(38/p.topDiameter*100));p.diameter=p.profile==='straight'?p.topDiameter:Math.max(p.diameter,p.topDiameter);p.socketDiameter=Math.min(p.socketDiameter,baseSocketMax(p));return validateBase(p);}
export function matchShadeBase(current,shade){const shape=['cube','pyramid'].includes(shade.shape)?'square':shade.shape==='hexagon'?'hexagon':shade.shape==='rounded-square'?'rounded-square':shade.depthRatio!==100?'oval':'circle';return patchBase(current,{shape,topDiameter:shade.diameter,diameter:Math.max(current.diameter,shade.diameter),depthRatio:shade.depthRatio,magnetRecesses:true});}
export function generateBase(input,{segments=256,layers=40,pocketSegments=96,preview=false}={}){
 const p=validateBase(input),v=[],f=[];if(p.e27Enabled)return generateE27Base(p,{segments,layers,pocketSegments,preview});if(p.texture==='clay')({segments,layers}=clayResolution(p,segments,layers,preview));if(p.texture==='fuzzy')({segments,layers}=fuzzyResolution(p,segments,layers,preview));
 const vertex=(x,y,z)=>{v.push(x,y,z);return v.length/3-1;},face=(a,b,c)=>f.push(a,b,c);
 const ring=(r,z,n=segments,cx=0,cy=0)=>Array.from({length:n},(_,i)=>{const a=i/n*2*Math.PI;return vertex(cx+r*Math.cos(a),cy+r*Math.sin(a),z);});
 const shapeParams={shape:p.shape==='square'?'cube':p.shape,depthRatio:p.depthRatio};
 const bridge=(a,b,inward=false)=>{for(let i=0;i<a.length;i++){const j=(i+1)%a.length;const tris=[[a[i],a[j],b[j]],[a[i],b[j],b[i]]];for(const tri of tris){if(inward)tri.reverse();face(...tri);}}};
 const cap=(outer,holes,up)=>{const ids=[...outer,...holes.flat()],points=ids.map(id=>new Vector2(v[id*3],v[id*3+1]));let off=outer.length;const hv=holes.map(h=>{const ret=points.slice(off,off+h.length);off+=h.length;return ret;});for(const tri of ShapeUtils.triangulateShape(points.slice(0,outer.length),hv)){const ids3=tri.map(id=>ids[id]),[a,b,c]=ids3;const cross=(v[b*3]-v[a*3])*(v[c*3+1]-v[a*3+1])-(v[b*3+1]-v[a*3+1])*(v[c*3]-v[a*3]);if((cross>0)!==up)ids3.reverse();face(...ids3);}};
 const outer=[];
 for(let k=0;k<=layers;k++){const t=k/layers,z=t*p.height;let blend=p.profile==='straight'?0:p.profile==='pedestal'?1-(1-t)**3:t;const r=p.diameter/2+(p.topDiameter-p.diameter)/2*blend;
 outer.push(Array.from({length:segments},(_,i)=>{const a=i/segments*2*Math.PI,phase=a-p.twist*Math.PI/180*t,fade=Math.min(1,z/2,(p.height-z)/3);let relief=0;if(p.texture==='fluted')relief=(1+Math.cos(phase*p.textureCount))/2;if(p.texture==='pleated')relief=1-Math.abs(((phase*p.textureCount/(2*Math.PI)%1+1)%1)*2-1);if(p.texture==='wave')relief=(1+Math.cos(phase*p.textureCount+t*2*Math.PI*3))/2;const fuzz=p.texture==='fuzzy'?fuzzyRelief(p,phase,r*sectionScale(shapeParams,a),z):0;const dent=p.texture==='clay'?clayIndent(p,a,z):0;const radius=r*sectionScale(shapeParams,a)+(p.textureDepth*relief+fuzz-dent)*Math.max(0,fade);return vertex(radius*Math.cos(a),radius*Math.sin(a),z);}));
 }
 for(let k=0;k<layers;k++)bridge(outer[k],outer[k+1]);
 const holeBottom=p.socketDiameter?ring(p.socketDiameter/2,0):[],holeTop=p.socketDiameter?ring(p.socketDiameter/2,p.height):[];
 if(p.socketDiameter)bridge(holeBottom,holeTop,true);
 const pockets=[],centerR=p.topDiameter*Math.min(1,p.depthRatio/100)/2-7;
 if(p.magnetRecesses)for(let i=0;i<3;i++){const a=i*2*Math.PI/3,cx=centerR*Math.cos(a),cy=centerR*Math.sin(a),bottom=ring(4.15,p.height-3.3,pocketSegments,cx,cy),ceiling=ring(4.15,p.height,pocketSegments,cx,cy);bridge(bottom,ceiling,true);cap(bottom,[],true);pockets.push({center:[cx,cy],radius:4.15,depth:3.3,bottom,ceiling});}
 const flatAnnulus=(a,b,up)=>{for(let i=0;i<a.length;i++){const j=(i+1)%a.length;for(const tri of [[a[i],a[j],b[j]],[a[i],b[j],b[i]]]){if(!up)tri.reverse();face(...tri);}}};
 const bottomCap=ring(p.diameter*Math.min(1,p.depthRatio/100)/2-1,0),topCap=ring(p.topDiameter*Math.min(1,p.depthRatio/100)/2-1,p.height);
 flatAnnulus(outer[0],bottomCap,false);flatAnnulus(outer.at(-1),topCap,true);
 cap(bottomCap,holeBottom.length?[holeBottom]:[],false);cap(topCap,[...(holeTop.length?[holeTop]:[]),...pockets.map(q=>q.ceiling)],true);
 return {positions:new Float32Array(v),indices:new Uint32Array(f),params:p,pockets,meshOpenings:[],bottom:{...BASE,thickness:p.height,backing:p.height-3.3},segments,layers};
}
