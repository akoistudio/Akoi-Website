import {CLAY_DEFAULTS,CLAY_LIMITS,clayIndent,clayResolution,clayFade} from './clay-texture.mjs';
import {flowingFold,panelRibPattern,panelResolution,maxPanelRibs} from './flowing-folds.mjs';
import { ShapeUtils, Vector2 } from 'three';
import {fuzzyRelief,fuzzyResolution} from './fuzzy-texture.mjs';
import {generateWavyBands} from './wavy-bands.mjs';

export const BASE = Object.freeze({ thickness: 5, rimWidth: 14, magnetCount: 3, magnetDiameter: 8.3, magnetDepth: 3.3, backing: 1.7 });
export const SHAPES = ['bell','drum','cone','vase','hourglass','dome','lantern','pebble','cube','pyramid','hexagon','oval','orb','rounded-square','sculpted','stacked','rounded-cylinder','flowing-folds','mushroom'];
export const TEXTURES = ['smooth','fluted','pleated','scalloped','diamond','mesh','woven','rings','bands','fuzzy','clay'];
export const DEFAULTS = {...CLAY_DEFAULTS,capDiameter:240,capRise:10,capRoundness:15,shape:'bell',texture:'fluted',height:200,diameter:180,topDiameter:100,wall:2,curve:12,twist:24,textureDepth:2,textureCount:64,stripeDepth:0,stripeCount:24,stripeWidth:50,waveDepth:0,waveCount:3,waveAround:6,socketDiameter:152,depthRatio:100,lockTop:false,meshColumns:32,meshRows:20,meshOpening:70,weaveColumns:96,weaveRows:72,weaveDepth:1.4,weaveOpen:true,weaveOpening:25,weaveStrand:1,smoothBottom:14,smoothTop:14,bulgeDepth:30,stackCount:3,leanX:0,leanY:0,asymmetricBulge:0,bulgePosition:50,bulgeDirection:0,lobeDepth:0,lobeCount:3,ringDepth:5,ringCount:12,ringSharpness:50,fuzzyDepth:.35,fuzzySpacing:1.5,fuzzyStretch:3,fuzzySeed:17,bodyDiameter:170,bottomShoulder:40,topShoulder:40,foldCount:3,foldDepth:25,foldRotation:120,foldSoftness:85,foldBottomBlend:60,foldTopBlend:0,foldSway:0,foldVariation:0,foldWaist:0,panelRibs:false,panelCoverage:65,panelRibCount:18,panelOffset:90,panelEdge:10};
export const LIMITS = {...CLAY_LIMITS,capDiameter:[100,300,1],capRise:[4,30,1],capRoundness:[0,100,1],height:[60,400,1],diameter:[60,300,1],topDiameter:[30,300,1],wall:[1.2,5,.1],curve:[-30,60,1],twist:[-180,180,1],textureDepth:[0,6,.1],textureCount:[8,96,1],stripeDepth:[0,6,.1],stripeCount:[4,64,1],stripeWidth:[10,90,1],waveDepth:[0,10,.1],waveCount:[1,12,1],waveAround:[1,16,1],socketDiameter:[10,272,.1],depthRatio:[50,180,1],meshColumns:[8,64,1],meshRows:[4,48,1],meshOpening:[25,85,1],weaveColumns:[16,128,1],weaveRows:[8,96,1],weaveDepth:[.2,3,.1],weaveOpening:[10,60,1],weaveStrand:[.4,3,.1],smoothBottom:[1,80,1],smoothTop:[0,80,1],bulgeDepth:[0,60,.1],stackCount:[2,6,1],leanX:[-60,60,1],leanY:[-60,60,1],asymmetricBulge:[0,40,.1],bulgePosition:[10,90,1],bulgeDirection:[-180,180,1],lobeDepth:[0,20,.1],lobeCount:[2,7,1],ringDepth:[0,12,.1],ringCount:[2,24,1],ringSharpness:[0,100,1],fuzzyDepth:[0,1,.05],fuzzySpacing:[.8,4,.1],fuzzyStretch:[1,8,1],fuzzySeed:[0,9999,1],bodyDiameter:[60,300,1],bottomShoulder:[5,100,1],topShoulder:[5,100,1],foldCount:[2,8,1],foldDepth:[0,40,.1],foldRotation:[-270,270,1],foldSoftness:[0,100,1],foldBottomBlend:[15,100,1],foldTopBlend:[0,100,1],foldSway:[-60,60,1],foldVariation:[0,80,1],foldWaist:[0,25,.1],panelCoverage:[25,90,1],panelRibCount:[4,24,1],panelOffset:[0,360,1],panelEdge:[0,25,1]};
export const PRESETS = {
 mushroom:{height:100,diameter:100,topDiameter:46,capDiameter:240,capRise:10,capRoundness:15,curve:0,twist:0,texture:'smooth',wall:1.2,textureDepth:0,smoothBottom:1,smoothTop:2,lockTop:false,leanX:0,leanY:0,asymmetricBulge:0,lobeDepth:0,stripeDepth:0,waveDepth:0,depthRatio:100},
 'flowing-folds':{height:240,diameter:120,topDiameter:110,curve:18,twist:0,texture:'smooth',textureDepth:0,stripeDepth:0,waveDepth:0,leanX:0,leanY:0,asymmetricBulge:0,lobeDepth:0,depthRatio:100,foldCount:3,foldDepth:25,foldRotation:120,foldSoftness:85,foldSway:0,foldVariation:0,foldWaist:0,foldBottomBlend:60,foldTopBlend:0,wall:1.2,smoothBottom:10,smoothTop:2,lockTop:false},
 'rounded-cylinder':{height:220,diameter:130,topDiameter:130,bodyDiameter:170,bottomShoulder:40,topShoulder:40,curve:0,twist:0,texture:'fluted',textureDepth:1.8,textureCount:36,wall:1.2,smoothBottom:1,smoothTop:1,lockTop:false},
 bell:{height:200,diameter:180,topDiameter:100,curve:12,twist:24},
 drum:{height:180,diameter:160,topDiameter:160,curve:0,twist:0},
 cone:{height:210,diameter:190,topDiameter:70,curve:0,twist:0},
 vase:{height:210,diameter:110,topDiameter:90,curve:20,twist:15},
 hourglass:{height:210,diameter:160,topDiameter:160,curve:0,twist:30},
 dome:{height:160,diameter:220,topDiameter:40,curve:0,twist:0},
 lantern:{height:220,diameter:140,topDiameter:100,curve:15,twist:30},
 pebble:{height:140,diameter:140,topDiameter:80,curve:20,twist:0},
 cube:{height:160,diameter:160,topDiameter:160,curve:0,twist:0,texture:'smooth',textureDepth:0},
 pyramid:{height:200,diameter:180,topDiameter:50,curve:0,twist:0,texture:'smooth',textureDepth:0},
 hexagon:{height:180,diameter:160,topDiameter:160,curve:0,twist:0},
 oval:{height:180,diameter:180,topDiameter:140,curve:15,twist:0,depthRatio:70},
 orb:{height:180,diameter:100,topDiameter:60,curve:0,twist:0},
 sculpted:{height:200,diameter:110,topDiameter:100,curve:0,twist:0,bulgeDepth:30},
 stacked:{height:240,diameter:110,topDiameter:110,curve:0,twist:0,bulgeDepth:45,stackCount:3},
 'rounded-square':{height:180,diameter:160,topDiameter:130,curve:12,twist:0}

};
for(const shape of SHAPES){const preset=PRESETS[shape];preset.depthRatio??=100;preset.socketDiameter=Math.min(42,Math.floor(preset.diameter*Math.min(1,preset.depthRatio/100)-28));}
export const SHAPE_NAMES={mushroom:'Mushroom cap','flowing-folds':'Flowing folds','rounded-cylinder':'Rounded cylinder','rounded-square':'Rounded square',woven:'Woven ribs',sculpted:'Sculpted waist',stacked:'Stacked lobes',rings:'Horizontal rings',bands:'Horizontal bands',clay:'Hand-worked clay',fuzzy:'Brushed / fuzzy'};
export function maxSocketDiameter(p){return Math.floor((p.diameter*Math.min(1,(p.depthRatio??100)/100)-28)*10+1e-8)/10;}
export function maxSmoothArea(p){return Math.min(80,Math.floor((p.height-7)/2));}
export function sectionScale(p,angle){
 const ratio=(p.depthRatio??100)/100,norm=Math.hypot(Math.cos(angle),Math.sin(angle)/ratio),a=Math.atan2(Math.sin(angle)/ratio,Math.cos(angle));
 let scale=1;
 if(['cube','pyramid'].includes(p.shape))scale=1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
 if(p.shape==='hexagon'){const sector=Math.PI/3,b=((a+sector/2)%sector+sector)%sector-sector/2;scale=1/Math.cos(b);}
 if(p.shape==='rounded-square')scale=(Math.abs(Math.cos(a))**4+Math.abs(Math.sin(a))**4)**(-.25);
 return scale/norm;
}
export function applyParameterPatch(current,patch){
 const next={...current,...patch};
 if(next.shape==='flowing-folds'&&next.texture==='fluted'&&next.panelRibs&&!('panelRibCount'in patch))next.panelRibCount=Math.min(next.panelRibCount,maxPanelRibs(next));
 if(next.shape==='mushroom'&&!('capDiameter'in patch))next.capDiameter=Math.max(next.capDiameter,next.diameter+10,next.topDiameter+10);
 if(next.shape==='rounded-cylinder'){if('height'in patch){const available=next.height-15,scale=Math.min(1,available/(next.bottomShoulder+next.topShoulder));next.bottomShoulder=Math.max(5,Math.floor(next.bottomShoulder*scale));next.topShoulder=Math.max(5,Math.floor(next.topShoulder*scale));}if(!('bodyDiameter'in patch))next.bodyDiameter=Math.max(next.bodyDiameter,next.diameter,next.topDiameter);}
 if('height'in patch){next.smoothBottom=Math.min(next.smoothBottom,maxSmoothArea(next));next.smoothTop=Math.min(next.smoothTop,maxSmoothArea(next));}
 if(!('depthRatio'in patch))next.depthRatio=Math.max(next.depthRatio,Math.ceil(38/next.diameter*100));
 if(!('socketDiameter'in patch))next.socketDiameter=Math.min(next.socketDiameter,maxSocketDiameter(next));
 return validateParams(next);
}
export function validateParams(input){
 if(!input || typeof input!=='object')throw new Error('Model parameters are required.');
 const p={...DEFAULTS,...input};if(!('socketDiameter' in input))p.socketDiameter=maxSocketDiameter(p);
 if(typeof p.weaveOpen!=='boolean')throw new Error('weaveOpen must be a boolean.');
 if(typeof p.panelRibs!=='boolean')throw new Error('Panel ribs must be enabled or disabled.');
 if(p.shape==='flowing-folds'&&p.texture==='fluted'&&p.panelRibs&&p.panelRibCount>maxPanelRibs(p))throw new Error(`Use at most ${maxPanelRibs(p)} ribs per panel for this coverage and fold count.`);
 if(typeof p.lockTop!=='boolean')throw new Error('lockTop must be a boolean.');
 if(!SHAPES.includes(p.shape)||!TEXTURES.includes(p.texture))throw new Error('Choose a supported shape and surface.');
 for(const [key,[min,max,step]]of Object.entries(LIMITS)){
  if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw new Error(`${key} must be between ${min} and ${max}.`);
  if(step===1&&!Number.isInteger(p[key]))throw new Error(`${key} must be a whole number.`);
 }
 if(p.shape==='mushroom'&&(p.capDiameter<Math.max(p.diameter,p.topDiameter)+10||p.capRise>=p.height-15))throw new Error('Mushroom cap: brim must be at least 10 mm wider than both ends; leave room above the underside flare.');
 if(p.shape==='rounded-cylinder'&&(p.bodyDiameter<Math.max(p.diameter,p.topDiameter)||p.bottomShoulder+p.topShoulder>p.height-15))throw new Error('Rounded cylinder: body width must cover both ends; leave at least 10 mm of straight middle.');
 if(p.smoothBottom>maxSmoothArea(p)||p.smoothTop>maxSmoothArea(p))throw new Error(`Smooth areas must be no larger than ${maxSmoothArea(p)} mm for this height.`);
 if(p.socketDiameter>maxSocketDiameter(p))throw new Error(`Socket opening must be no larger than ${maxSocketDiameter(p)} mm to protect the magnet recesses.`);
 for(const key of Object.keys(input))if(!(key in DEFAULTS))throw new Error(`Unknown parameter: ${key}`);
 return p;
}
export function topLockBlend(p,t){
 if(!p.lockTop)return 0;
 const x=Math.max(0,Math.min(1,(t-1)*(p.height-5)/Math.max(1,p.smoothTop)+1));
 return x*x*(3-2*x);
}
export function radiusAt(p,t,angle){
 const rb=p.diameter/2,rt=p.topDiameter/2;
 let r=rb+(rt-rb)*t;
 if(p.shape==='rounded-cylinder'){const z=t*(p.height-5),body=p.bodyDiameter/2;r=z<p.bottomShoulder?rb+(body-rb)*Math.sin(Math.PI/2*z/p.bottomShoulder):z>p.height-5-p.topShoulder?rt+(body-rt)*Math.sin(Math.PI/2*(p.height-5-z)/p.topShoulder):body;}
 if(p.shape==='mushroom'){const z=t*(p.height-5),q=Math.max(0,Math.min(1,(z-p.capRise)/(p.height-5-p.capRise)));r=z<p.capRise?rb+(p.capDiameter/2-rb)*Math.sin(Math.PI/2*z/p.capRise):rt+(p.capDiameter/2-rt)*(1-q)+p.capRoundness/100*(p.capDiameter/2-rt)*.32*Math.sin(Math.PI*q);}
 if(p.shape==='bell')r=rt+(rb-rt)*(1-t)**2;
 if(p.shape==='vase')r+=rb*.45*Math.sin(Math.PI*t)**1.4;
 if(p.shape==='hourglass')r-=Math.min(rb,rt)*.42*Math.sin(Math.PI*t);
 if(p.shape==='dome')r=rt+(rb-rt)*Math.cos(t*Math.PI/2);
 if(p.shape==='lantern')r+=rb*.3*Math.sin(Math.PI*t)**.7;
 if(p.shape==='pebble')r+=rb*.32*Math.sin(Math.PI*t)**.8;
 if(p.shape==='orb')r+=rb*.95*Math.sin(Math.PI*t)**.75;
 if(p.shape==='sculpted')r+=p.bulgeDepth*Math.sin(Math.PI*t)*Math.cos(4*Math.PI*(t-.25));
 if(p.shape==='stacked')r+=p.bulgeDepth*Math.abs(Math.sin(Math.PI*p.stackCount*t))**1.4;
 const anchor=Math.min(1,t*(p.height-5)/14),direction=(angle-p.bulgeDirection*Math.PI/180);
 r+=anchor*(p.asymmetricBulge*Math.exp(-(((t-p.bulgePosition/100)/.22)**2))*(.5+.5*Math.cos(direction))+p.lobeDepth*Math.sin(Math.PI*t)**2*Math.cos(direction*p.lobeCount));
 r+=p.curve*Math.sin(Math.PI*t);
 if(p.shape==='flowing-folds')r+=flowingFold(p,t,angle)-p.foldWaist*Math.sin(Math.PI*t)**2;
 const phase=angle-p.twist*Math.PI/180*t;
 let pat=0;
 if(p.texture==='fluted')pat=p.shape==='flowing-folds'&&p.panelRibs?panelRibPattern(p,t,angle):(1+Math.cos(phase*p.textureCount))/2;
 if(p.texture==='pleated')pat=1-Math.abs((phase*p.textureCount/(2*Math.PI)%1+1)%1*2-1);
 if(p.texture==='scalloped')pat=Math.sin(phase*p.textureCount/2)**4;
 if(p.texture==='rings'){const u=(t*(p.height-5)-p.smoothBottom)/Math.max(1,p.height-5-p.smoothBottom-p.smoothTop)*p.ringCount,triangle=1-Math.abs(((u%1+1)%1)*2-1);pat=(1-p.ringSharpness/100)*(.5-.5*Math.cos(u*2*Math.PI))+p.ringSharpness/100*triangle;}
 if(p.texture==='bands'){
  // Broad flat panels separated by shallow, beveled seams. Scaling the
  // relief by the outline keeps square faces planar, including at corners.
  const u=(t*(p.height-5)-p.smoothBottom)/Math.max(1,p.height-5-p.smoothBottom-p.smoothTop)*p.ringCount;
  const fraction=(u%1+1)%1,edge=.16-.10*p.ringSharpness/100;
  const x=Math.min(1,Math.min(fraction,1-fraction)/edge);pat=x*x*(3-2*x);
 }
 if(p.texture==='diamond')pat=(1+Math.cos(phase*p.textureCount)*Math.cos(t*Math.PI*20))/2;
 const z=t*(p.height-5),fade=x=>{const a=Math.max(0,Math.min(1,x));return a*a*(3-2*a);};
 const smooth=fade((z-p.smoothBottom)/3)*(p.smoothTop?fade(((p.height-5)-z-p.smoothTop)/3):1);
 const stripe=Math.max(0, (Math.cos(phase*p.stripeCount)-Math.cos(Math.PI*p.stripeWidth/100))/(1-Math.cos(Math.PI*p.stripeWidth/100)));
 const wave=p.waveDepth*Math.sin(t*2*Math.PI*p.waveCount+phase*p.waveAround);
 const scale=sectionScale(p,phase),relief=p.texture==='bands'?p.ringDepth*pat*scale:(p.texture==='rings'?p.ringDepth:p.textureDepth)*pat,free=Math.max((p.wall+2)*scale,Math.max(14+p.wall,r)*scale+smooth*(relief+p.stripeDepth*stripe+wave));
 const locked=rt*sectionScale(p,angle),blendTop=topLockBlend(p,t);
 const fuzz=p.texture==='fuzzy'?smooth*fuzzyRelief(p,phase,r*scale,z):0;
 const dent=p.texture==='clay'?smooth*clayIndent(p,angle,z):0;
 return (free+fuzz-dent)*(1-blendTop)+locked*blendTop;
}
export function generateModel(input,{segments=384,layers=128,pocketSegments=96,preview=false}={}){
 const checked=validateParams(input);segments=panelResolution(checked,segments);if(checked.texture==='clay')({segments,layers}=clayResolution(checked,segments,layers,preview));if(checked.texture==='fuzzy')({segments,layers}=fuzzyResolution(checked,segments,layers,preview));if(checked.texture==='woven')return deformShade(generateWavyBands(checked,{segments,pocketSegments,fine:layers>=160},{generateModel,radiusAt,sectionScale,topLockBlend,BASE}));
 const p=checked,isMesh=p.texture==='mesh',isBands=p.texture==='bands',isRings=p.texture==='rings'||isBands,columns=p.meshColumns,rows=isRings?p.ringCount:p.meshRows,opening=p.meshOpening;
 let cellSegments=0,cellLayers=0,bandLayers=0,topLayers=0;
 if(isMesh||isRings){
  cellSegments=Math.max(2,Math.ceil(segments/columns/2)*2);
  bandLayers=Math.max(2,Math.ceil(layers*p.smoothBottom/(p.height-5)));
  topLayers=p.smoothTop?Math.max(2,Math.ceil(layers*p.smoothTop/(p.height-5))):0;
  cellLayers=Math.max(isBands?32:isRings?6:2,Math.ceil(layers*((p.height-5)-p.smoothBottom-p.smoothTop)/(p.height-5)/rows/2)*2);
  if(isMesh)segments=columns*cellSegments;layers=bandLayers+topLayers+rows*cellLayers;
 }
 const tAt=k=>!isMesh&&!isRings?k/layers:k===layers?1:k<=bandLayers?(k/bandLayers)*p.smoothBottom/(p.height-5):topLayers&&k>=layers-topLayers?1-(layers-k)/topLayers*p.smoothTop/(p.height-5):p.smoothBottom/(p.height-5)+(k-bandLayers)/(rows*cellLayers)*((p.height-5)-p.smoothBottom-p.smoothTop)/(p.height-5);
 const angleAt=(u,t)=>u/segments*2*Math.PI+(isMesh?p.twist*Math.PI/180*t*(1-topLockBlend(p,t)):0);
 const vertices=[],faces=[];
 const vertex=(x,y,z)=>{vertices.push(x,y,z);return vertices.length/3-1};
 const face=(a,b,c)=>faces.push(a,b,c);
 const ring=(r,z,n=segments,cx=0,cy=0)=>Array.from({length:n},(_,i)=>{const a=i/n*2*Math.PI;return vertex(cx+r*Math.cos(a),cy+r*Math.sin(a),z)});
 const bridge=(a,b,inward=false)=>{for(let i=0;i<a.length;i++){const j=(i+1)%a.length; if(inward){face(a[i],b[j],a[j]);face(a[i],b[i],b[j]);}else{face(a[i],a[j],b[j]);face(a[i],b[j],b[i]);}}};
 const rb=p.diameter/2,ri=p.socketDiameter/2;
 const outer0=Array.from({length:segments},(_,i)=>{const a=i/segments*2*Math.PI,r=rb*sectionScale(p,a);return vertex(r*Math.cos(a),r*Math.sin(a),0)}),inner0=ring(ri,0),rimInnerTop=ring(ri,5);
 const outer=[],inner=[];
 for(let k=0;k<=layers;k++){
  const t=tAt(k),z=5+t*(p.height-5);const ro=[],rn=[];
  for(let i=0;i<segments;i++){const a=angleAt(i,t),r=radiusAt(p,t,a);ro.push(vertex(r*Math.cos(a),r*Math.sin(a),z));const blendTop=topLockBlend(p,t),wall=p.wall*(sectionScale(p,a-p.twist*Math.PI/180*t)*(1-blendTop)+sectionScale(p,a)*blendTop);const innerRadius=(['fuzzy','clay'].includes(p.texture)?radiusAt({...p,texture:'smooth'},t,a):r)-wall-(p.texture==='clay'?p.clayDepth*clayFade(p,t):0);rn.push(vertex(innerRadius*Math.cos(a),innerRadius*Math.sin(a),z));}
  outer.push(ro);inner.push(rn);
 }
 bridge(outer0,outer[0]);bridge(inner0,rimInnerTop,true);
 const meshOpenings=[];
 if(!isMesh){for(let k=0;k<layers;k++){bridge(outer[k],outer[k+1]);bridge(inner[k],inner[k+1],true);}}
 else{
  for(let k=0;k<bandLayers;k++){bridge(outer[k],outer[k+1]);bridge(inner[k],inner[k+1],true);}
  for(let k=layers-topLayers;k<layers;k++){bridge(outer[k],outer[k+1]);bridge(inner[k],inner[k+1],true);}
  const point=(u,k,inward)=>{const t=tAt(k),a=angleAt(u,t),blend=topLockBlend(p,t),wall=p.wall*(sectionScale(p,a-p.twist*Math.PI/180*t)*(1-blend)+sectionScale(p,a)*blend),r=radiusAt(p,t,a)-(inward?wall:0);return vertex(r*Math.cos(a),r*Math.sin(a),5+t*(p.height-5));};
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const u0=col*cellSegments,u1=u0+cellSegments,k0=bandLayers+row*cellLayers,k1=k0+cellLayers,perimeter=[];
   for(let u=u0;u<u1;u++)perimeter.push([u,k0]);
   for(let k=k0;k<k1;k++)perimeter.push([u1,k]);
   for(let u=u1;u>u0;u--)perimeter.push([u,k1]);
   for(let k=k1;k>k0;k--)perimeter.push([u0,k]);
   const outerEdge=[],innerEdge=[],outerHole=[],innerHole=[];
   for(const [u,k]of perimeter){
    outerEdge.push(outer[k][u%segments]);innerEdge.push(inner[k][u%segments]);
    const x=(u-(u0+u1)/2)/cellSegments,y=(k-(k0+k1)/2)/cellLayers,f=opening/100*.5/(Math.abs(x)+Math.abs(y)),hu=(u0+u1)/2+x*f*cellSegments,hk=(k0+k1)/2+y*f*cellLayers;
    outerHole.push(point(hu,hk,false));innerHole.push(point(hu,hk,true));
   }
   for(let i=0;i<perimeter.length;i++){const j=(i+1)%perimeter.length;
    face(outerEdge[i],outerEdge[j],outerHole[j]);face(outerEdge[i],outerHole[j],outerHole[i]);
    face(innerEdge[i],innerHole[j],innerEdge[j]);face(innerEdge[i],innerHole[i],innerHole[j]);
    face(outerHole[i],outerHole[j],innerHole[j]);face(outerHole[i],innerHole[j],innerHole[i]);
   }
   const t=tAt((k0+k1)/2);meshOpenings.push({angle:angleAt((u0+u1)/2,t),height:5+t*(p.height-5),boundaryAngle:angleAt(u0,t),outerBoundary:outerHole,innerBoundary:innerHole});
  }
 }
 // One connected annulus; no coincident solids and no boolean operations.
 const cap=(outside,holes,up)=>{
  const ids=[...outside,...holes.flat()];
  const vec=ids.map(i=>new Vector2(vertices[i*3],vertices[i*3+1]));
  const triangles=ShapeUtils.triangulateShape(vec.slice(0,outside.length),holes.map((h,j)=>{const off=outside.length+holes.slice(0,j).reduce((s,v)=>s+v.length,0);return vec.slice(off,off+h.length)}));
  for(const [a,b,c]of triangles){const ia=ids[a],ib=ids[b],ic=ids[c];const cross=(vertices[ib*3]-vertices[ia*3])*(vertices[ic*3+1]-vertices[ia*3+1])-(vertices[ib*3+1]-vertices[ia*3+1])*(vertices[ic*3]-vertices[ia*3]);if((cross>0)===up)face(ia,ib,ic);else face(ia,ic,ib);}
 };
 const annulus=(outside,inside,up)=>{for(let i=0;i<outside.length;i++){const j=(i+1)%outside.length;if(up){face(outside[i],outside[j],inside[j]);face(outside[i],inside[j],inside[i]);}else{face(outside[i],inside[j],outside[j]);face(outside[i],inside[i],inside[j]);}}};
 annulus(inner[0],rimInnerTop,true);annulus(outer[layers],inner[layers],true);
 const pockets=[];const pocketR=BASE.magnetDiameter/2;const centerR=p.diameter*Math.min(1,p.depthRatio/100)/2-BASE.rimWidth/2;
 for(let k=0;k<3;k++){
  const a=k*2*Math.PI/3,cx=centerR*Math.cos(a),cy=centerR*Math.sin(a);
  const bottom=ring(pocketR,0,pocketSegments,cx,cy),ceiling=ring(pocketR,BASE.magnetDepth,pocketSegments,cx,cy);
  bridge(bottom,ceiling,true);cap(ceiling,[],false);
  pockets.push({center:[cx,cy],radius:pocketR,depth:BASE.magnetDepth,bottom,ceiling});
 }
 const bottomCircle=ring(centerR+BASE.rimWidth/2-1,0);annulus(outer0,bottomCircle,false);cap(bottomCircle,[inner0,...pockets.map(v=>v.bottom)],false);
 return deformShade({positions:new Float32Array(vertices),indices:new Uint32Array(faces),params:p,pockets,meshOpenings,bottom:BASE,segments,layers});
}
export function deformShade(model){
 const p=model.params;if(!p.leanX&&!p.leanY)return model;
 // Horizontal sections stay planar; the mounting rim and pockets stay fixed.
 const v=model.positions;for(let i=0;i<v.length;i+=3){const t=Math.max(0,Math.min(1,(v[i+2]-19)/(p.height-19))),blend=t*t*(3-2*t);v[i]+=p.leanX*blend;v[i+1]+=p.leanY*blend;}return model;
}
export function inspectModel(model){
 const {positions:v,indices:f}=model;let volume=0,degenerate=0;const edges=new Map();
 for(let i=0;i<f.length;i+=3){
  const ids=[f[i],f[i+1],f[i+2]],a=ids[0]*3,b=ids[1]*3,c=ids[2]*3;
  const ab=[v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],ac=[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]];
  const nx=ab[1]*ac[2]-ab[2]*ac[1],ny=ab[2]*ac[0]-ab[0]*ac[2],nz=ab[0]*ac[1]-ab[1]*ac[0];
  if(nx*nx+ny*ny+nz*nz<1e-12)degenerate++;
  volume+=(v[a]*(v[b+1]*v[c+2]-v[b+2]*v[c+1])+v[a+1]*(v[b+2]*v[c]-v[b]*v[c+2])+v[a+2]*(v[b]*v[c+1]-v[b+1]*v[c]))/6;
  for(let j=0;j<3;j++){const x=ids[j],y=ids[(j+1)%3],key=x<y?`${x},${y}`:`${y},${x}`;const e=edges.get(key)||[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);}
 }
 let openEdges=0,badWinding=0;for(const [n,d]of edges.values()){if(n!==2)openEdges++;if(d!==0)badWinding++;}
 let maxR=0;for(let i=0;i<v.length;i+=3)maxR=Math.max(maxR,Math.hypot(v[i],v[i+1]));
 return {valid:!openEdges&&!badWinding&&!degenerate&&volume>0,openEdges,badWinding,degenerate,triangles:f.length/3,volumeCm3:volume/1000,maxDiameter:2*maxR,height:model.params.height,recessCount:model.pockets.length,meshOpeningCount:model.meshOpenings?.length||0,backingMm:BASE.backing};
}
export function toBinarySTL(model){
 const {positions:v,indices:f}=model;const count=f.length/3;const buffer=new ArrayBuffer(84+count*50),d=new DataView(buffer);
 const header=new TextEncoder().encode(model.params.kind==='diffuser'?'AKOI DIFFUSER | mm | Z up | separate smooth shell with socket flange':model.params.kind==='lid'?`AKOI LID | mm | Z up | continuous blind groove ${model.params.grooveDepth}mm`:model.params.kind==='base'?`AKOI BASE | mm | Z up | ${model.pockets.length} blind recesses D8.3 x 3.3`:'AKOI | mm | Z up | 3 blind recesses D8.3 x 3.3 | rim 5 | backing 1.7');new Uint8Array(buffer).set(header.slice(0,80));d.setUint32(80,count,true);
 for(let i=0;i<count;i++){
  const off=84+i*50,a=f[i*3]*3,b=f[i*3+1]*3,c=f[i*3+2]*3;
   const abx=v[b]-v[a],aby=v[b+1]-v[a+1],abz=v[b+2]-v[a+2];
   const acx=v[c]-v[a],acy=v[c+1]-v[a+1],acz=v[c+2]-v[a+2];
   const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx,len=Math.hypot(nx,ny,nz)||1;
   d.setFloat32(off,nx/len,true);d.setFloat32(off+4,ny/len,true);d.setFloat32(off+8,nz/len,true);
   for(let k=0;k<3;k++){
    d.setFloat32(off+12+k*4,v[a+k],true);
    d.setFloat32(off+24+k*4,v[b+k],true);
    d.setFloat32(off+36+k*4,v[c+k],true);
   }
 }
 return buffer;
}
