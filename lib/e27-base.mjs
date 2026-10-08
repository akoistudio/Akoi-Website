import {ShapeUtils,Vector2} from 'three';
import {fuzzyRelief,fuzzyResolution} from './fuzzy-texture.mjs';
import {clayIndent,clayResolution} from './clay-texture.mjs';
export const E27_DEFAULTS={e27Enabled:false,e27Wall:2.4,e27Barrel:40,e27Tolerance:.5,e27Ring:56,e27Deck:5,e27Depth:65,e27CableWidth:12,e27CableHeight:7,e27HolderHeight:35,e27BulbDiameter:45,e27BulbHeight:75,e27Clearance:8};
export const E27_LIMITS={e27Wall:[1.6,6,.1],e27Barrel:[28,50,.1],e27Tolerance:[.1,1,.1],e27Ring:[45,75,.1],e27Deck:[3,8,.1],e27Depth:[12,240,1],e27CableWidth:[8,20,1],e27CableHeight:[4,12,1],e27HolderHeight:[15,70,1],e27BulbDiameter:[25,90,1],e27BulbHeight:[40,140,1],e27Clearance:[3,30,1]};
export const e27Opening=p=>p.e27Barrel+2*p.e27Tolerance;
export const e27PlateZ=p=>p.height-p.e27Depth;
export function e27BodyRadius(p,z){const t=z/p.height,b=p.profile==='straight'?0:p.profile==='pedestal'?1-(1-t)**3:t;return p.diameter/2+(p.topDiameter-p.diameter)/2*b;}
export function validateE27Base(p){
 if(typeof p.e27Enabled!=='boolean')throw new Error('E27 mount must be enabled or disabled.');
 if(!p.e27Enabled)return;
 if(p.shape!=='circle'||p.depthRatio!==100)throw new Error('E27 hollow stems currently use a circular outline.');
 if(p.height<30||p.e27Depth>p.height-p.e27Deck-p.e27CableHeight-2)throw new Error('Raise the base height or reduce the mount depth to leave room for the deck and cable exit.');
 if(p.socketDiameter<10)throw new Error('E27 bases need an open top for bulb access and ventilation.');
 const inner=e27BodyRadius(p,e27PlateZ(p))-p.e27Wall-(p.texture==='clay'?p.clayDepth:0);
 if(p.e27Ring<e27Opening(p)+4||p.e27Ring/2>inner-1)throw new Error('Holder rings need at least 2 mm overlap around the aperture and 1 mm clearance to the stem wall.');
 if(p.socketDiameter/2>p.topDiameter/2-p.e27Wall)throw new Error('Reduce the top opening or stem wall thickness.');
}
// One connected solid: hollow stem, internal clamping deck, protected 5 mm
// magnet rim, underside service access, and an open-bottom cable notch.
export function generateE27Base(p,{segments=256,layers=40,pocketSegments=96}={}){
 if(p.texture==='fuzzy')({segments,layers}=fuzzyResolution(p,segments,layers));
 if(p.texture==='clay')({segments,layers}=clayResolution(p,segments,layers));
 segments=Math.max(384,segments);
 const v=[],f=[],vertex=(x,y,z)=>{v.push(x,y,z);return v.length/3-1;},face=(a,b,c)=>f.push(a,b,c),tau=2*Math.PI;
 const notch=a=>{const arc=Math.abs(a-Math.PI)*p.diameter/2,half=p.e27CableWidth/2;return arc>=half?0:p.e27CableHeight*Math.min(1,(half-arc)/1);};
 const ring=(r,z,n=segments,cx=0,cy=0)=>Array.from({length:n},(_,i)=>{const a=i/n*tau,zz=typeof z==='function'?z(a):z,rr=typeof r==='function'?r(zz,a):r;return vertex(cx+rr*Math.cos(a),cy+rr*Math.sin(a),zz);});
 const bridge=(a,b,inward=false)=>{for(let i=0;i<a.length;i++){const j=(i+1)%a.length;for(const tri of [[a[i],a[j],b[j]],[a[i],b[j],b[i]]]){if(inward)tri.reverse();face(...tri);}}};
 const annulus=(a,b,up)=>{for(let i=0;i<a.length;i++){const j=(i+1)%a.length;for(const tri of [[a[i],a[j],b[j]],[a[i],b[j],b[i]]]){if(!up)tri.reverse();face(...tri);}}};
 const cap=(outer,holes,up)=>{const ids=[...outer,...holes.flat()],points=ids.map(id=>new Vector2(v[id*3],v[id*3+1]));let off=outer.length;const hv=holes.map(h=>{const a=points.slice(off,off+h.length);off+=h.length;return a;});for(const tri of ShapeUtils.triangulateShape(points.slice(0,outer.length),hv)){const q=tri.map(i=>ids[i]),[a,b,c]=q,cross=(v[b*3]-v[a*3])*(v[c*3+1]-v[a*3+1])-(v[b*3+1]-v[a*3+1])*(v[c*3]-v[a*3]);if((cross>0)!==up)q.reverse();face(...q);}};
 const plate=e27PlateZ(p),floor=plate-p.e27Deck,roof=p.height-5,first=p.e27CableHeight+1;
 const levels=[first,floor,plate,roof,p.height];for(let k=1;k<layers;k++){const z=k/layers*p.height;if(z>first)levels.push(z);}const zs=[...new Set(levels)].sort((a,b)=>a-b);
 const innerR=z=>e27BodyRadius(p,z)-p.e27Wall-(p.texture==='clay'?p.clayDepth*Math.max(0,Math.min(1,z/2,(p.height-z)/3)):0);
 const outerR=(z,a)=>{const r=e27BodyRadius(p,z),t=z/p.height,phase=a-p.twist*Math.PI/180*t,fade=Math.max(0,Math.min(1,z/2,(p.height-z)/3));let relief=0;if(p.texture==='fluted')relief=p.textureDepth*(1+Math.cos(phase*p.textureCount))/2;if(p.texture==='pleated')relief=p.textureDepth*(1-Math.abs(((phase*p.textureCount/tau%1+1)%1)*2-1));if(p.texture==='wave')relief=p.textureDepth*(1+Math.cos(phase*p.textureCount+t*tau*3))/2;if(p.texture==='fuzzy')relief=fuzzyRelief(p,phase,r,z);if(p.texture==='clay')relief=-clayIndent(p,a,z);return r+fade*relief;};
 const outer=[ring(outerR,notch),...zs.map(z=>ring(outerR,z))];for(let k=0;k<outer.length-1;k++)bridge(outer[k],outer[k+1]);
 const innerBottom=ring(innerR,notch),lower=[innerBottom,...zs.filter(z=>z<=floor).map(z=>ring(innerR,z))];for(let k=0;k<lower.length-1;k++)bridge(lower[k],lower[k+1],true);annulus(outer[0],innerBottom,false);
 const boreBottom=ring(e27Opening(p)/2,floor),boreTop=ring(e27Opening(p)/2,plate);annulus(lower.at(-1),boreBottom,false);bridge(boreBottom,boreTop,true);
 const upper=zs.filter(z=>z>=plate&&z<=roof).map(z=>ring(innerR,z));annulus(upper[0],boreTop,true);for(let k=0;k<upper.length-1;k++)bridge(upper[k],upper[k+1],true);
 const topBoreBottom=ring(p.socketDiameter/2,roof),topBore=ring(p.socketDiameter/2,p.height);annulus(upper.at(-1),topBoreBottom,false);bridge(topBoreBottom,topBore,true);
 const pockets=[],centerR=p.topDiameter/2-7;
 if(p.magnetRecesses)for(let k=0;k<3;k++){const a=k*tau/3,cx=centerR*Math.cos(a),cy=centerR*Math.sin(a),bottom=ring(4.15,p.height-3.3,pocketSegments,cx,cy),ceiling=ring(4.15,p.height,pocketSegments,cx,cy);bridge(bottom,ceiling,true);cap(bottom,[],true);pockets.push({center:[cx,cy],radius:4.15,depth:3.3,bottom,ceiling});}
 const topCap=ring(p.topDiameter/2-1,p.height);annulus(outer.at(-1),topCap,true);cap(topCap,[topBore,...pockets.map(q=>q.ceiling)],true);
 return {positions:new Float32Array(v),indices:new Uint32Array(f),params:p,pockets,meshOpenings:[],bottom:{thickness:5,backing:1.7},segments,layers:zs.length,mount:{opening:e27Opening(p),plateZ:plate,deck:p.e27Deck,cableWidth:p.e27CableWidth,cableHeight:p.e27CableHeight}};
}
