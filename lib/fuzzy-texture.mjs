// Continuous seeded value noise in millimetres. Cartesian sampling joins
// seamlessly around the circumference and remains stable at STL resolution.
const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,y,z,seed)=>{let h=Math.imul(x,73856093)^Math.imul(y,19349663)^Math.imul(z,83492791)^Math.imul(seed+1,2654435761);h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return ((h^(h>>>16))>>>0)/4294967295;};
export function fuzzyRelief(p,angle,radius,z){
 const x=radius*Math.cos(angle)/p.fuzzySpacing,y=radius*Math.sin(angle)/p.fuzzySpacing,w=z/(p.fuzzySpacing*p.fuzzyStretch);
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(w),tx=smooth(x-ix),ty=smooth(y-iy),tz=smooth(w-iz);
 const plane=k=>mix(mix(hash(ix,iy,k,p.fuzzySeed),hash(ix+1,iy,k,p.fuzzySeed),tx),mix(hash(ix,iy+1,k,p.fuzzySeed),hash(ix+1,iy+1,k,p.fuzzySeed),tx),ty);
 return p.fuzzyDepth*mix(plane(iz),plane(iz+1),tz);
}
export function fuzzyResolution(p,segments,layers,preview=false){
 // Bound tessellation for responsive preview/export; finer grains use more
 // samples. Keep square/hexagon corners on the angular grid.
 const width=Math.max(p.diameter,p.topDiameter)*Math.max(1,p.depthRatio/100);
 return {segments:Math.min(preview?384:768,Math.max(segments,Math.ceil(Math.PI*width/p.fuzzySpacing*2/24)*24)),layers:Math.min(preview?96:192,Math.max(layers,Math.ceil(p.height/(p.fuzzySpacing*p.fuzzyStretch)*2)))};
}
