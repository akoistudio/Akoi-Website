// Broad radial folds rotate along Z. Their envelope is independent of surface
// texture, keeping the bottom mounting rim and optional top collar circular.
export function foldEnvelope(p,t){
 const z=t*(p.height-5),smooth=u=>{const x=Math.max(0,Math.min(1,u));return x*x*(3-2*x);};
 return smooth(z/p.foldBottomBlend)*(p.foldTopBlend?smooth((p.height-5-z)/p.foldTopBlend):1);
}
export function flowingFold(p,t,angle){
 const phase=p.foldCount*(angle-(p.foldRotation*t+(p.foldSway||0)*Math.sin(2*Math.PI*t))*Math.PI/180),c=Math.cos(phase),exponent=1+3*(1-p.foldSoftness/100);
 return p.foldDepth*(1-(p.foldVariation||0)/100*Math.sin(Math.PI*t)**2)*foldEnvelope(p,t)*Math.sign(c)*Math.abs(c)**exponent;
}

export function panelRibPattern(p,t,angle){
 const cycle=p.foldCount*(angle-(p.foldRotation*t+(p.foldSway||0)*Math.sin(2*Math.PI*t))*Math.PI/180)-p.panelOffset*Math.PI/180;
 const u=((cycle/(2*Math.PI)+.5)%1+1)%1-.5,width=p.panelCoverage/100;
 if(Math.abs(u)>=width/2)return 0;
 const q=(u+width/2)/width,edge=p.panelEdge/100,smooth=x=>{const a=Math.max(0,Math.min(1,x));return a*a*(3-2*a);};
 const feather=edge?smooth(q/edge)*smooth((1-q)/edge):1;
 return feather*(1-Math.cos(2*Math.PI*q*p.panelRibCount))/2;
}
export function maxPanelRibs(p){return Math.max(4,Math.min(24,Math.floor(256*p.panelCoverage/100/p.foldCount)));}
export function panelResolution(p,segments){
 if(p.shape!=='flowing-folds'||p.texture!=='fluted'||!p.panelRibs)return segments;
 return Math.ceil(Math.max(segments,p.foldCount*p.panelRibCount/(p.panelCoverage/100)*6)/24)*24;
}
