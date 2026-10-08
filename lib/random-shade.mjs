import {DEFAULTS,validateParams} from './model.mjs';

// One dominant silhouette and finish per family. Ranges are deliberately
// coordinated, rather than sampling every editor slider independently.
export const RANDOM_FAMILIES = [
 'Pleated taper','Soft bell','Paper lantern','Sculpted waist','Organic stack',
 'Soft square','Drifting oval','Ripple drum','Wavy weave','Diamond lattice'
];

export function randomShade(current=DEFAULTS,random=Math.random,previousFamily=''){
 const mount=validateParams(current);
 const unit=()=>{const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw new Error('Random source must return a number from 0 up to 1.');return n;};
 const range=(a,b)=>a+(b-a)*unit(),integer=(a,b)=>Math.floor(range(a,b+1));
 const decimal=(a,b)=>Math.round(range(a,b)*10)/10;
 const available=RANDOM_FAMILIES.filter(name=>name!==previousFamily);
 const family=available[integer(0,available.length-1)];
 const diameter=integer(Math.max(90,Math.ceil(mount.socketDiameter+28)),Math.min(300,Math.max(180,Math.ceil(mount.socketDiameter+28)+30)));
 const p={...DEFAULTS,diameter,socketDiameter:mount.socketDiameter,wall:mount.wall,lockTop:mount.lockTop,
  height:integer(160,235),topDiameter:Math.round(diameter*range(.55,.8)),
  curve:0,twist:0,textureDepth:decimal(1.2,2.6),
  textureCount:Math.min(96,Math.max(24,Math.round(Math.PI*diameter/range(6,10)/4)*4)),
  smoothBottom:integer(5,10),smoothTop:integer(3,8),bulgeDepth:0};
 switch(family){
  case 'Pleated taper':Object.assign(p,{shape:'cone',texture:'pleated',height:Math.round(diameter*range(.65,.95)),topDiameter:Math.round(diameter*range(.3,.48))});break;
  case 'Soft bell':Object.assign(p,{shape:'bell',texture:'fluted',curve:integer(5,14),height:Math.round(diameter*range(.9,1.2)),twist:integer(-18,18)});break;
  case 'Paper lantern':Object.assign(p,{shape:'lantern',texture:'pleated',topDiameter:Math.round(diameter*range(.75,.95)),height:Math.round(diameter*range(.9,1.25)),textureDepth:decimal(1,1.8)});break;
  case 'Sculpted waist':Object.assign(p,{shape:'sculpted',texture:'fluted',topDiameter:diameter,height:integer(210,260),bulgeDepth:decimal(12,23),twist:integer(-12,12)});break;
  case 'Organic stack':Object.assign(p,{shape:'stacked',texture:'fluted',topDiameter:diameter,height:integer(215,265),bulgeDepth:decimal(12,24),stackCount:integer(2,3),leanX:integer(-12,12),asymmetricBulge:decimal(2,7),bulgeDirection:integer(-180,180),textureDepth:decimal(1,1.8)});break;
  case 'Soft square':Object.assign(p,{shape:'rounded-square',texture:unit()<.5?'smooth':'fluted',topDiameter:Math.round(diameter*range(.78,1)),height:Math.round(diameter*range(.8,1.1)),curve:integer(0,8),lockTop:true});break;
  case 'Drifting oval':Object.assign(p,{shape:'oval',texture:'fluted',depthRatio:integer(Math.max(75,Math.ceil((mount.socketDiameter+28)/diameter*100)),100),curve:integer(4,10),leanX:integer(-16,16),leanY:integer(-8,8),asymmetricBulge:decimal(3,8),bulgeDirection:integer(-180,180),twist:integer(-20,20)});break;
  case 'Ripple drum':Object.assign(p,{shape:'drum',texture:'rings',topDiameter:diameter,height:Math.round(diameter*range(.7,1)),ringDepth:decimal(2.5,5),ringCount:integer(7,12),ringSharpness:integer(15,65)});break;
  case 'Wavy weave':Object.assign(p,{shape:unit()<.5?'drum':'bell',texture:'woven',topDiameter:Math.round(diameter*range(.82,1)),height:integer(160,210),weaveColumns:integer(18,24)*4,weaveDepth:decimal(1.3,1.7),weaveStrand:1,smoothBottom:integer(7,12),smoothTop:integer(7,12)});p.weaveRows=Math.round((p.height-5-p.smoothBottom-p.smoothTop)/range(2.4,3.2));break;
  case 'Diamond lattice':Object.assign(p,{shape:'drum',texture:'mesh',topDiameter:Math.round(diameter*range(.85,1)),height:integer(160,210),meshColumns:integer(24,32),meshRows:integer(14,20),meshOpening:integer(45,60),smoothBottom:integer(8,12),smoothTop:integer(8,12)});break;
 }
 // Reset secondary effects, keeping the mounting fit and material wall chosen
 // by the user. The existing geometry builder owns all fixed magnet details.
 p.height=Math.min(320,Math.max(90,p.height));p.topDiameter=Math.max(40,p.topDiameter);
 return {family,params:validateParams(p)};
}
