// Analytic union of stacked corrugated bands. Each row is one continuous
// wavy perimeter; interfaces expose only material not shared by both rows.
export function generateWavyBands(p,{segments,pocketSegments,fine},kernel){
 const {generateModel,radiusAt,sectionScale,topLockBlend,BASE}=kernel,smooth={...p,texture:'smooth',leanX:0,leanY:0};
 const base=generateModel(smooth,{segments,layers:2,pocketSegments});
 const vertices=[],faces=[],lookup=new Map(),oldIds=new Map();
 const vertex=(x,y,z)=>{
  const xyz=[x,y,z].map(v=>Math.abs(v)<1e-8?0:Math.fround(v));
  const key=xyz.join(',');if(lookup.has(key))return lookup.get(key);
  const id=vertices.length/3;vertices.push(...xyz);lookup.set(key,id);return id;
 };
 const face=(a,b,c)=>{if(a!==b&&b!==c&&c!==a)faces.push(a,b,c);};
 const importVertex=id=>{if(!oldIds.has(id))oldIds.set(id,vertex(...base.positions.slice(id*3,id*3+3)));return oldIds.get(id);};
 for(let i=0;i<base.indices.length;i+=3){const ids=Array.from(base.indices.slice(i,i+3));if(ids.every(id=>base.positions[id*3+2]<=5))face(...ids.map(importVertex));}
 const n=p.weaveColumns,amp=p.weaveDepth/2,line=p.weaveOpen?p.weaveStrand:Math.max(p.weaveStrand,p.weaveDepth+.2);
 const pitch=(p.height-5-p.smoothBottom-p.smoothTop)/p.weaveRows,steps=Math.max(segments,n*(fine?12:6));
 const bands=[{lo:5,hi:5+p.smoothBottom,amp:0,width:p.wall}];
 for(let row=0;row<p.weaveRows;row++)bands.push({lo:5+p.smoothBottom+row*pitch,hi:5+p.smoothBottom+(row+1)*pitch,amp:row%2?-amp:amp,width:line});
 if(p.smoothTop)bands.push({lo:p.height-p.smoothTop,hi:p.height,amp:0,width:p.wall});
 const phaseAt=z=>p.twist*Math.PI/180*(z-5)/(p.height-5);
 const interval=(band,a,z)=>{
  const t=(z-5)/(p.height-5),blend=topLockBlend(p,t),scale=sectionScale(p,a-phaseAt(z))*(1-blend)+sectionScale(p,a)*blend,outer=radiusAt(smooth,t,a),center=outer-p.wall*scale/2+band.amp*(1-blend)*scale*Math.cos(n*(a-phaseAt(z)));
  const width=band.width*(1-blend)+p.wall*blend;
  return [center-width*scale/2,center+width*scale/2];
 };
 const anglesAt=(before,after,z)=>{
  const uniform=Array.from({length:steps},(_,i)=>i/steps*2*Math.PI),a=[];
  if(before&&after&&before.amp!==after.amp){
   const delta=before.amp-after.amp,phase=phaseAt(z);
   for(const value of [(after.width-before.width)/(2*delta),(before.width-after.width)/(2*delta),(after.width+before.width)/(2*delta),-(after.width+before.width)/(2*delta)]){
    if(Math.abs(value)>=1)continue;
    const root=Math.acos(value);
    for(let j=0;j<n;j++)for(const sign of [-1,1])a.push(((phase+(j*2*Math.PI+sign*root)/n)%(2*Math.PI)+2*Math.PI)%(2*Math.PI));
   }
  }
  a.sort((x,y)=>x-y);const roots=a.filter((v,i)=>!i||v-a[i-1]>1e-8);
  // Keep analytic crossings; omit almost coincident regular samples that
  // would otherwise make microscopic sliver triangles at row interfaces.
  const nearRoot=angle=>{let lo=0,hi=roots.length;while(lo<hi){const mid=(lo+hi)>>1;if(roots[mid]<angle)lo=mid+1;else hi=mid;}return (lo<roots.length&&roots[lo]-angle<1e-5)||(lo>0&&angle-roots[lo-1]<1e-5);};
  return [...roots,...uniform.filter(angle=>angle===0||!nearRoot(angle))].sort((x,y)=>x-y).filter((v,i,all)=>!i||v-all[i-1]>1e-8);
 };
 const interfaces=Array.from({length:bands.length+1},(_,i)=>{
  const z=i===bands.length?p.height:bands[i].lo;
  const angles=i===0?Array.from({length:segments},(_,j)=>j/segments*2*Math.PI):anglesAt(bands[i-1],bands[i],z);
  return {z,angles,before:bands[i-1],after:bands[i]};
 });
 // Each row interface is sampled repeatedly by rings and adjacent caps.
 // Reuse its exact radial bounds without changing coordinates or topology.
 const boundCache=new Map();
 const bounds=(a,b,angle,z)=>{
  let row=boundCache.get(z);if(!row){row=new Map();boundCache.set(z,row);}
  const cached=row.get(angle);
  if(cached)return cached.a===a?cached.values:[cached.values[2],cached.values[3],cached.values[0],cached.values[1]];
  const values=[...interval(a,angle,z),...interval(b,angle,z)];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(Math.abs(values[i]-values[j])<1e-7)values[i]=values[j]=Math.min(values[i],values[j]);row.set(angle,{a,values});return values;};
 const ring=(band,edge,surface)=>surface.angles.map(a=>{const r=surface.before&&surface.after?bounds(surface.before,surface.after,a,surface.z)[(band===surface.before?0:2)+edge]:interval(band,a,surface.z)[edge];return vertex(r*Math.cos(a),r*Math.sin(a),surface.z);});
 const stitch=(low,high,lowAngles,highAngles,inward)=>{
  let i=0,j=0;
  while(i<low.length||j<high.length){
   const ai=i<low.length?(i+1<low.length?lowAngles[i+1]:2*Math.PI):Infinity;
   const aj=j<high.length?(j+1<high.length?highAngles[j+1]:2*Math.PI):Infinity;
   let tri;
   if(ai<=aj){tri=[low[i%low.length],low[(i+1)%low.length],high[j%high.length]];i++;}
   else{tri=[low[i%low.length],high[(j+1)%high.length],high[j%high.length]];j++;}
   if(inward)tri.reverse();face(...tri);
  }
 };
 for(let i=0;i<bands.length;i++){
  const b=bands[i],lo=interfaces[i],hi=interfaces[i+1];
  for(const edge of [0,1])stitch(ring(b,edge,lo),ring(b,edge,hi),lo.angles,hi.angles,edge===0);
 }
 const subtract=(x,y)=>{
  // Bound references [inner A, outer A, inner B, outer B].
  if(y[0]>=x[1]||y[1]<=x[0])return [[0,1]];
  const parts=[];if(y[0]>x[0])parts.push([0,2]);if(y[1]<x[1])parts.push([3,1]);return parts;
 };
 const capPart=(a,b,z,theta0,theta1,refs,up)=>{
  const r0=bounds(a,b,theta0,z),r1=bounds(a,b,theta1,z);
  const ids=[vertex(r0[refs[0]]*Math.cos(theta0),r0[refs[0]]*Math.sin(theta0),z),vertex(r0[refs[1]]*Math.cos(theta0),r0[refs[1]]*Math.sin(theta0),z),vertex(r1[refs[1]]*Math.cos(theta1),r1[refs[1]]*Math.sin(theta1),z),vertex(r1[refs[0]]*Math.cos(theta1),r1[refs[0]]*Math.sin(theta1),z)];
  const tris=[[ids[0],ids[1],ids[2]],[ids[0],ids[2],ids[3]]];for(const tri of tris){if(!up)tri.reverse();face(...tri);}
 };
 const wavySlots=[];
 for(let i=1;i<bands.length;i++){
  const a=bands[i-1],b=bands[i],{z,angles}=interfaces[i];
  for(let j=0;j<angles.length;j++){
   const left=angles[j],right=j+1<angles.length?angles[j+1]:2*Math.PI,mid=(left+right)/2,x=interval(a,mid,z),y=interval(b,mid,z);
   for(const refs of subtract(x,y))capPart(a,b,z,left,right,refs,true);
   for(const refs of subtract(y,x))capPart(b,a,z,left,right,refs,false);
  }
  const angle=phaseAt(z)+(b.amp<a.amp?Math.PI/n:0),x=interval(a,angle,z),y=interval(b,angle,z);
  if(y[0]>x[1]+1e-4)wavySlots.push({angle,height:z,innerRadius:x[1],outerRadius:y[0],outwardAbove:true});
  else if(x[0]>y[1]+1e-4)wavySlots.push({angle,height:z,innerRadius:y[1],outerRadius:x[0],outwardAbove:false});
 }
 const last=bands.at(-1),top=interfaces.at(-1),inner=ring(last,0,top),outer=ring(last,1,top);
 for(let i=0;i<outer.length;i++){const j=(i+1)%outer.length;face(outer[i],outer[j],inner[j]);face(outer[i],inner[j],inner[i]);}
 const pockets=base.pockets.map(q=>({...q,bottom:q.bottom.map(importVertex),ceiling:q.ceiling.map(importVertex)}));
 return {positions:new Float32Array(vertices),indices:new Uint32Array(faces),params:p,pockets,bottom:BASE,segments:steps,layers:bands.length,meshOpenings:[],wavyBands:p.weaveRows,wavySlots};
}
