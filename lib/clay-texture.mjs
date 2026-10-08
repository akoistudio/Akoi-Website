// Seeded, shallow oval tool marks. Smooth compact support avoids cell seams.
export const CLAY_DEFAULTS={clayDepth:.35,claySize:5,claySpacing:8,clayStretch:1.5,claySeed:31};
export const CLAY_LIMITS={clayDepth:[0,.8,.05],claySize:[3,12,.1],claySpacing:[5,24,.1],clayStretch:[1,3,.1],claySeed:[0,9999,1]};
const hash=(x,y,s)=>{let h=Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^Math.imul(s+1,83492791);h=Math.imul(h^(h>>>16),2246822507);return ((h^(h>>>13))>>>0)/4294967295;};
export function clayIndent(p,a,z){
 const circumference=Math.PI*Math.max(p.diameter,p.topDiameter,p.bodyDiameter||0)*Math.max(1,p.depthRatio/100),n=Math.max(8,Math.round(circumference/p.claySpacing)),pitch=circumference/n;
 const u=((a/(2*Math.PI)%1+1)%1)*n,v=z/(p.claySpacing*p.clayStretch),ix=Math.floor(u),iy=Math.floor(v);
 let dent=0;
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
  const x=ix+dx,y=iy+dy,k=(x%n+n)%n,h=hash(k,y,p.claySeed),j=hash(k,y,p.claySeed+137);
  const cx=x+.25+.5*h,cy=y+.25+.5*j,rx=p.claySize/2*(.7+.3*j),ry=rx*p.clayStretch;
  const q=((u-cx)*pitch/rx)**2+((v-cy)*p.claySpacing*p.clayStretch/ry)**2;
  if(q<1)dent=Math.max(dent,p.clayDepth*(.55+.45*h)*(1-q)**2);
 }
 return dent;
}
export function clayResolution(p,segments,layers,preview=false){
 const width=Math.max(p.diameter,p.topDiameter,p.bodyDiameter||0)+2*(Math.abs(p.curve||0)+(p.foldDepth||0));
 return {segments:Math.min(preview?384:1536,Math.max(segments,Math.ceil(Math.PI*width*Math.max(1,p.depthRatio/100)/p.claySize*5/24)*24)),layers:Math.min(preview?96:512,Math.max(layers,Math.ceil(p.height/(p.claySize*p.clayStretch)*5)))};
}
export function clayFade(p,t){const z=t*(p.height-5),smooth=x=>{const q=Math.max(0,Math.min(1,x));return q*q*(3-2*q);};return smooth((z-p.smoothBottom)/3)*(p.smoothTop?smooth((p.height-5-z-p.smoothTop)/3):1)*(1-(p.lockTop?smooth((t-1)*(p.height-5)/Math.max(1,p.smoothTop)+1):0));}
