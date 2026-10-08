import {radiusAt,sectionScale,topLockBlend} from './model.mjs';
import {e27PlateZ,e27BodyRadius,e27Opening} from './e27-base.mjs';
export function e27Fit(shade,base){
 if(!base.e27Enabled)return {enabled:false,valid:true,clearance:0,issues:[]};
 const issues=[],plate=e27PlateZ(base),bulbBottom=plate+base.e27HolderHeight,bulbTop=bulbBottom+base.e27BulbHeight;
 let gap=Infinity;
 const available=z=>{
  if(z<base.height-5)return e27BodyRadius(base,z)-base.e27Wall-(base.texture==='clay'?base.clayDepth:0);
  if(z<=base.height)return base.socketDiameter/2;
  const q=z-base.height;if(q<=5)return shade.socketDiameter/2;
  if(q>shade.height)return 0;
  const t=(q-5)/(shade.height-5),blend=topLockBlend(shade,t);let min=Infinity;
  for(let i=0;i<128;i++){const a=i/128*2*Math.PI,scale=sectionScale(shade,a-shade.twist*Math.PI/180*t)*(1-blend)+sectionScale(shade,a)*blend;const inner=radiusAt(shade,t,a)-shade.wall*scale-(shade.texture==='clay'?shade.clayDepth:0),center=Math.hypot(shade.leanX,shade.leanY)*t*t;min=Math.min(min,inner-center);}
  return min;
 };
 // Conservative cylindrical envelopes, including the holder's retaining ring.
 for(const [start,end,r] of [[plate,plate+3,base.e27Ring/2],[plate+3,bulbBottom,base.e27Barrel/2],[bulbBottom,bulbTop,base.e27BulbDiameter/2]])for(let k=0;k<=160;k++){const z=start+(end-start)*k/160;gap=Math.min(gap,available(z)-r);}
 if(gap<base.e27Clearance)issues.push(`Minimum estimated radial gap ${gap.toFixed(1)} mm; target ${base.e27Clearance} mm. Enlarge the stem/openings or adjust mount depth and bulb size.`);
 if(bulbTop+base.e27Clearance>base.height+shade.height)issues.push('Bulb envelope needs more space below the top opening. Increase cap height or lower the holder.');
 if(base.socketDiameter<base.e27BulbDiameter+2*base.e27Clearance||shade.socketDiameter<base.e27BulbDiameter+2*base.e27Clearance)issues.push('The bulb needs a wider passage through both mounting openings.');
 return {enabled:true,valid:issues.length===0,clearance:gap,issues,plateZ:plate,opening:e27Opening(base),bulbBottom,bulbTop};
}
export function e27Hardware(base){
 const v=[],f=[],tau=2*Math.PI,plate=e27PlateZ(base);
 const revolve=points=>{const rings=points.map(([r,z])=>Array.from({length:64},(_,i)=>{const a=i/64*tau;v.push(r*Math.cos(a),r*Math.sin(a),z);return v.length/3-1;}));for(let k=0;k<rings.length-1;k++)for(let i=0;i<64;i++){const j=(i+1)%64;f.push(rings[k][i],rings[k][j],rings[k+1][j],rings[k][i],rings[k+1][j],rings[k+1][i]);}};
 revolve([[0,plate-10],[base.e27Barrel/2,plate-10],[base.e27Barrel/2,plate],[base.e27Ring/2,plate],[base.e27Ring/2,plate+3],[base.e27Barrel/2,plate+3],[base.e27Barrel/2,plate+base.e27HolderHeight],[0,plate+base.e27HolderHeight]]);
 const bottom=plate+base.e27HolderHeight;revolve(Array.from({length:25},(_,i)=>{const t=i/24;return [Math.max(.001,Math.sin(Math.PI*t)*base.e27BulbDiameter/2),bottom+base.e27BulbHeight*t];}));
 return {positions:new Float32Array(v),indices:new Uint32Array(f),params:{kind:'hardware'},pockets:[]};
}
