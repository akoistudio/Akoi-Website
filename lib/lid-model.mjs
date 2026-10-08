import {DEFAULTS,validateParams,radiusAt,sectionScale,topLockBlend} from './model.mjs';
export const LID_DEFAULTS={kind:'lid',height:6,grooveDepth:3,clearance:.25,lipWidth:2,overhang:1,ventDiameter:0,source:{...DEFAULTS}};
export const LID_LIMITS={height:[3,15,.1],grooveDepth:[.5,8,.1],clearance:[0,1,.05],lipWidth:[1,6,.1],overhang:[0,10,.1],ventDiameter:[0,100,.1]};
export function validateLid(input){
 const p={...LID_DEFAULTS,...input,source:validateParams(input?.source??DEFAULTS)};
 if(p.kind!=='lid')throw new Error('Choose a lid project.');
 for(const [key,[lo,hi]]of Object.entries(LID_LIMITS))if(!Number.isFinite(p[key])||p[key]<lo||p[key]>hi)throw new Error(`${key} must be ${lo}–${hi} mm.`);
 if(p.height-p.grooveDepth<1.2-1e-8)throw new Error('Leave at least 1.2 mm of closed lid above the groove.');
 if(['woven','mesh'].includes(p.source.texture)&&p.source.smoothTop<p.grooveDepth+1)throw new Error('For open-texture shades, add a smooth top area at least 1 mm taller than the groove depth, then match again.');
 for(const key of Object.keys(input??{}))if(!(key in LID_DEFAULTS))throw new Error(`Unknown lid parameter: ${key}`);
 const innerMin=Math.min(...Array.from({length:96},(_,i)=>lidRim(p,i/96*Math.PI*2).inner));
 if(innerMin<2||p.ventDiameter/2>innerMin-1)throw new Error('Reduce the center opening or groove clearance to leave a solid center and inner groove wall.');
 return p;
}
export function matchShadeLid(current,shade){return validateLid({...current,source:validateParams(shade)});}
export function lidMatches(p,shade){return JSON.stringify(validateParams(shade))===JSON.stringify(p.source);}
export function lidRim(p,angle){
 const s=p.source;let outer=0,inner=Infinity;
 // Enclose the full insertion depth, including taper and twist. The extra
 // allowance for shifted section centers preserves the upper body's offset.
 for(let i=0;i<=24;i++){
  const z=s.height-p.grooveDepth*i/24,t=(z-5)/(s.height-5),blend=Math.max(0,Math.min(1,(z-19)/(s.height-19))),shift=2*Math.hypot(s.leanX,s.leanY)*(1-blend*blend*(3-2*blend));
  const lock=topLockBlend(s,t),wall=s.wall*(sectionScale(s,angle-s.twist*Math.PI/180*t)*(1-lock)+sectionScale(s,angle)*lock);
  const ro=radiusAt(s,t,angle),ri=(s.texture==='fuzzy'?radiusAt({...s,texture:'smooth'},t,angle):ro)-wall;
  outer=Math.max(outer,ro+shift);inner=Math.min(inner,ri-shift);
 }
 const scale=sectionScale(s,angle-(s.lockTop?0:s.twist*Math.PI/180)),clearance=p.clearance*scale;
 return {outer:outer+clearance,inner:inner-clearance};
}
export function generateLid(input,{segments=384}={}){
 const p=validateLid(input),v=[],f=[],vertex=(x,y,z)=>{v.push(x,y,z);return v.length/3-1;},face=(a,b,c)=>f.push(a,b,c);
 // Multiples of 24 retain square and hexagonal corners.
 segments=Math.ceil(segments/24)*24;
 const profiles=Array.from({length:segments},(_,i)=>lidRim(p,i/segments*2*Math.PI));
 const ring=(r,z)=>Array.from({length:segments},(_,i)=>{const a=i/segments*2*Math.PI,rr=typeof r==='function'?r(i):r;return vertex(rr*Math.cos(a),rr*Math.sin(a),z);});
 const bridge=(a,b,inward=false)=>{for(let i=0;i<segments;i++){const j=(i+1)%segments;for(const tri of [[a[i],a[j],b[j]],[a[i],b[j],b[i]]]){if(inward)tri.reverse();face(...tri);}}};
 const annulus=(outside,inside,up)=>{for(let i=0;i<segments;i++){const j=(i+1)%segments;for(const tri of [[outside[i],outside[j],inside[j]],[outside[i],inside[j],inside[i]]]){if(!up)tri.reverse();face(...tri);}}};
 const disk=(outside,z,up)=>{const center=vertex(0,0,z);for(let i=0;i<segments;i++){const j=(i+1)%segments;up?face(center,outside[i],outside[j]):face(center,outside[j],outside[i]);}};
 const inner0=ring(i=>profiles[i].inner,0),innerRoof=ring(i=>profiles[i].inner,p.grooveDepth),outer0=ring(i=>profiles[i].outer,0),outerRoof=ring(i=>profiles[i].outer,p.grooveDepth);
 const edge=i=>profiles[i].outer+(p.lipWidth+p.overhang)*sectionScale(p.source,i/segments*2*Math.PI-(p.source.lockTop?0:p.source.twist*Math.PI/180));
 const edge0=ring(edge,0),edgeTop=ring(edge,p.height);
 bridge(inner0,innerRoof);bridge(outer0,outerRoof,true);annulus(outerRoof,innerRoof,false);annulus(edge0,outer0,false);bridge(edge0,edgeTop);
 if(p.ventDiameter){const hole0=ring(p.ventDiameter/2,0),holeTop=ring(p.ventDiameter/2,p.height);annulus(inner0,hole0,false);annulus(edgeTop,holeTop,true);bridge(hole0,holeTop,true);}else{disk(inner0,0,false);disk(edgeTop,p.height,true);}
 let diameter=0;for(let i=0;i<v.length;i+=3)diameter=Math.max(diameter,2*Math.hypot(v[i],v[i+1]));
 return {positions:new Float32Array(v),indices:new Uint32Array(f),params:{...p,shape:p.source.shape,diameter,topDiameter:diameter,depthRatio:100},pockets:[],groove:profiles,segments};
}
