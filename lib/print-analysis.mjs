export function analyzePrint(model,volume){
 const v=model.positions,f=model.indices,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<v.length;i+=3)for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[i+k]);max[k]=Math.max(max[k],v[i+k]);}
 let overhang=0;
 for(let i=0;i<f.length;i+=3){const a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3;if(Math.min(v[a+2],v[b+2],v[c+2])<=5.01)continue;const ab=[v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],ac=[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]],nx=ab[1]*ac[2]-ab[2]*ac[1],ny=ab[2]*ac[0]-ab[0]*ac[2],nz=ab[0]*ac[1]-ab[1]*ac[0];if(nz<0)overhang=Math.max(overhang,Math.atan2(-nz,Math.hypot(nx,ny))*180/Math.PI);}
 const size=max.map((n,k)=>n-min[k]),fits=size.every((n,k)=>n<=volume[k]);
 return {size,min,max,fits,overhang};
}
import {generateModel,applyParameterPatch,LIMITS,maxSocketDiameter} from './model.mjs';
export function fitShadeToVolume(input,volume){
 let p={...input};
 for(let attempt=0;attempt<5;attempt++){
  const report=analyzePrint(generateModel(p,{segments:192,layers:80,pocketSegments:64}),volume);
  if(report.fits)return p;
  const scale=.97*Math.min(...volume.map((limit,i)=>limit/report.size[i]));
  const patch={};
  for(const key of ['capDiameter','capRise','height','diameter','topDiameter','curve','textureDepth','stripeDepth','waveDepth','ringDepth','bulgeDepth','leanX','leanY','asymmetricBulge','lobeDepth','socketDiameter','smoothBottom','smoothTop','clayDepth','claySize','claySpacing','fuzzyDepth','fuzzySpacing','bodyDiameter','bottomShoulder','topShoulder','foldDepth','foldWaist','foldBottomBlend','foldTopBlend']){const [lo,hi,step]=LIMITS[key];patch[key]=Math.max(lo,Math.min(hi,Math.round(p[key]*scale/step)*step));}
  const trial={...p,...patch};patch.socketDiameter=Math.min(patch.socketDiameter,maxSocketDiameter(trial));p=applyParameterPatch(p,patch);
 }
 throw new Error('This build volume is too small for the protected mounting rim and parameter limits. Choose a smaller starting shape or a larger volume.');
}
