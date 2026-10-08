import assert from 'node:assert/strict';
export function parseSTL(buffer){
 const view=new DataView(buffer),n=view.getUint32(80,true);assert.equal(buffer.byteLength,84+n*50);
 const positions=[],indices=[],map=new Map();
 for(let i=0;i<n;i++)for(let j=0;j<3;j++){const off=84+i*50+12+j*12,xyz=[0,1,2].map(k=>view.getFloat32(off+k*4,true));assert.ok(xyz.every(Number.isFinite));const key=xyz.join(',');let id=map.get(key);if(id===undefined){id=positions.length/3;map.set(key,id);positions.push(...xyz);}indices.push(id);}
 return {positions:new Float32Array(positions),indices:new Uint32Array(indices)};
}
export function zHits(mesh,x,y){const {positions:v,indices:f}=mesh,out=[];for(let i=0;i<f.length;i+=3){const a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3,den=(v[b+1]-v[c+1])*(v[a]-v[c])+(v[c]-v[b])*(v[a+1]-v[c+1]);if(Math.abs(den)<1e-10)continue;const u=((v[b+1]-v[c+1])*(x-v[c])+(v[c]-v[b])*(y-v[c+1]))/den,w=((v[c+1]-v[a+1])*(x-v[c])+(v[a]-v[c])*(y-v[c+1]))/den,t=1-u-w;if(u>=-1e-8&&w>=-1e-8&&t>=-1e-8){const z=u*v[a+2]+w*v[b+2]+t*v[c+2];out.push(z);}}return [...new Set(out.map(z=>Math.round(z*1e5)/1e5))].sort((a,b)=>a-b);}
export function measureRecesses(mesh,p){
 const {positions:v,indices:f}=mesh;const edges=new Map();
 for(let i=0;i<f.length;i+=3){const ids=[f[i],f[i+1],f[i+2]];if(ids.every(k=>Math.abs(v[k*3+2]-3.3)<1e-5))for(const id of ids){if(!edges.has(id))edges.set(id,new Set());for(const j of ids)edges.get(id).add(j);}}
 const groups=[],seen=new Set();for(const id of edges.keys()){if(seen.has(id))continue;const g=[],queue=[id];while(queue.length){const next=queue.pop();if(seen.has(next))continue;seen.add(next);g.push(next);for(const n of edges.get(next))if(!seen.has(n))queue.push(n);}groups.push(g);}
 assert.equal(groups.length,3,'STL must contain exactly three pocket ceilings');
 const centers=groups.map(g=>{const xs=g.map(i=>v[i*3]),ys=g.map(i=>v[i*3+1]),cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;const rs=g.map(i=>Math.hypot(v[i*3]-cx,v[i*3+1]-cy));assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-8.3)<.00003,'diameter X');assert.ok(Math.abs(Math.max(...ys)-Math.min(...ys)-8.3)<.00003,'diameter Y');assert.ok(rs.every(r=>Math.abs(r-4.15)<.00003),'cylindrical pocket');for(const dx of [0,1,-1,3.7]){const hits=zHits(mesh,cx+dx,cy+.117);assert.equal(hits[0],3.3,'pocket begins at its closed ceiling');assert.ok(hits[1]>=5,'at least 1.7 mm solid backing');}assert.ok(Math.abs(Math.hypot(cx,cy)-(p.diameter*Math.min(1,p.depthRatio/100)/2-7))<.00003);return [cx,cy];});
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const a=centers[i],b=centers[j],dot=(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b));assert.ok(Math.abs(dot+.5)<1e-5,'120 degree spacing');}
 // Material adjacent to the cavities occupies the full 5 mm rim.
 assert.deepEqual(zHits(mesh,p.diameter/2-12.131,.213).slice(0,2),[0,5]);
 assert.deepEqual(zHits(mesh,.171,.217).filter(z=>z<=5),[],'lamp socket stays open through the integrated bottom');
 const bottomRadii=[];for(let i=0;i<v.length;i+=3)if(Math.abs(v[i+2])<1e-8)bottomRadii.push(Math.hypot(v[i],v[i+1]));assert.ok(Math.abs(Math.min(...bottomRadii)*2-p.socketDiameter)<.00004,'exported socket diameter matches control');
 const sr=p.socketDiameter/2;assert.deepEqual(zHits(mesh,sr-.15,.01).filter(z=>z<=5),[],'socket stays open through the full bottom');assert.deepEqual(zHits(mesh,sr+.15,.01).filter(z=>z<=5),[0,5],'socket boundary has solid backing beside it');
 return {socketDiameterMm:p.socketDiameter,count:groups.length,diameterMm:8.3,depthMm:3.3,rimMm:5,backingMm:1.7};
}
