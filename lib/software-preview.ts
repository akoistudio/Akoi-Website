import {generateModel} from './model.mjs';
import {generateBase} from './base-model.mjs';
const generateObject=(params:any,options:any)=>params.kind==='base'?generateBase(params,options):generateModel(params,options);
const previewObject=(m:any)=>['assembly','lid','diffuser','layered'].includes(m.params.kind)?m:generateObject(m.params,{segments:192,layers:80,pocketSegments:64});
// CPU renderer for environments without WebGL; projects the real closed mesh.
export function createSoftwarePreview(el:HTMLDivElement,initial:any,initialColor:string){
 const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','Interactive software 3D model. Drag to orbit, scroll to zoom.');el.appendChild(canvas);const ctx=canvas.getContext('2d')!;
 let model=previewObject(initial),color=initialColor,az=.9,elev=.22,distance=600,grid=true,wire=false,auto=false,mode='perspective',frame=0,dirty=true,disposed=false,last=0;
 let w=1,h=1,ratio=1;
 const fit=(v='perspective')=>{mode=v;const p=model.params;distance=Math.max(p.height,Math.max(p.diameter,p.topDiameter)*Math.max(1,p.depthRatio/100)*1.25)*2.65+80;if(v==='front'){az=-Math.PI/2;elev=0;}else if(v==='top'){az=-Math.PI/2;elev=Math.PI/2-.001;}else if(v==='bottom'){az=-Math.PI/2;elev=-Math.PI/2+.001;}else{az=.9;elev=.22;}dirty=true;};fit();
 const draw=()=>{
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const v=model.positions,f=model.indices,ca=Math.cos(az),sa=Math.sin(az),ce=Math.cos(elev),se=Math.sin(elev),center=model.params.height/2,focal=Math.min(w,h)*1.65;
  const projection=(x:number,y:number,z:number)=>{const depth=distance-ce*ca*x-ce*sa*y-se*(z-center);return [w/2+(-sa*x+ca*y)*focal/depth,h/2-(-se*ca*x-se*sa*y+ce*(z-center))*focal/depth,depth];};
  if(grid&&mode!=='bottom'){ctx.strokeStyle='#b4aa9340';ctx.lineWidth=.7;for(let i=-400;i<=400;i+=25){for(const line of [[i,-400,-.5,i,400,-.5],[-400,i,-.5,400,i,-.5]]){const a=projection(line[0],line[1],line[2]),b=projection(line[3],line[4],line[5]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}}}
  const projected=new Float32Array(v.length);for(let i=0;i<v.length;i+=3)projected.set(projection(v[i],v[i+1],v[i+2]),i);
  const triangles:any[]=[];const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const cam=[ce*ca*distance,ce*sa*distance,se*distance+center];
  for(let i=0;i<f.length;i+=3){const a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3;const ab=[v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],ac=[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]],n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],len=Math.hypot(...n);if(n[0]*(cam[0]-v[a])+n[1]*(cam[1]-v[a+1])+n[2]*(cam[2]-v[a+2])<=0)continue;
   const lighting=.61+.37*Math.max(0,(-n[0]*.4-n[1]*.5+n[2]*.75)/len)+.1*Math.max(0,(n[0]*ca+n[1]*sa)*ce/len);triangles.push([a,b,c,(projected[a+2]+projected[b+2]+projected[c+2])/3,lighting]);
  }
  const iw=Math.ceil(w),ih=Math.ceil(h),image=ctx.createImageData(iw,ih),pixels=image.data,zbuffer=new Float32Array(iw*ih);zbuffer.fill(Infinity);
  for(const [a,b,c,,light]of triangles){
   const ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1],area=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(area)<1e-8)continue;
   const minX=Math.max(0,Math.floor(Math.min(ax,bx,cx))),maxX=Math.min(iw-1,Math.ceil(Math.max(ax,bx,cx))),minY=Math.max(0,Math.floor(Math.min(ay,by,cy))),maxY=Math.min(ih-1,Math.ceil(Math.max(ay,by,cy)));
   const cavity=[a,b,c].every(id=>Math.abs(v[id+2]-(model.params.kind==='base'?model.params.height-3.3:3.3))<.001),shade=light*(cavity?.7:1);const faceRGB=model.colors?[0,1,2].map(k=>{const linear=model.colors[a+k];return Math.round(255*(linear<=.0031308?linear*12.92:1.055*linear**(1/2.4)-.055));}):rgb;const colors=faceRGB.map((channel:number)=>Math.min(255,Math.round(channel*shade+12)));
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/area,q=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/area,r=1-u-q;if(u<-.00001||q<-.00001||r<-.00001)continue;
    const z=1/(u/projected[a+2]+q/projected[b+2]+r/projected[c+2]),id=y*iw+x;if(z>=zbuffer[id])continue;zbuffer[id]=z;const off=id*4,edge=wire&&Math.min(u,q,r)<.08;pixels[off]=edge?75:colors[0];pixels[off+1]=edge?66:colors[1];pixels[off+2]=edge?51:colors[2];pixels[off+3]=255;
   }
  }
  const bitmap=document.createElement('canvas');bitmap.width=iw;bitmap.height=ih;bitmap.getContext('2d')!.putImageData(image,0,0);ctx.drawImage(bitmap,0,0,w,h);

 };
 const loop=(now:number)=>{if(disposed)return;if(auto&&now-last>35){az+=.012;dirty=true;last=now;}if(dirty){dirty=false;draw();}frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
 const resize=new ResizeObserver(()=>{w=el.clientWidth;h=el.clientHeight;ratio=Math.min(devicePixelRatio,1.5);canvas.width=w*ratio;canvas.height=h*ratio;canvas.style.width=w+'px';canvas.style.height=h+'px';dirty=true;});resize.observe(el);
 let pointer:[number,number]|null=null;
 const down=(e:PointerEvent)=>{pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);canvas.focus();};
 const move=(e:PointerEvent)=>{if(!pointer)return;az-=(e.clientX-pointer[0])*.008;elev=Math.max(-Math.PI/2+.001,Math.min(Math.PI/2-.001,elev+(e.clientY-pointer[1])*.006));pointer=[e.clientX,e.clientY];dirty=true;};
 const up=()=>{pointer=null;};const wheel=(e:WheelEvent)=>{e.preventDefault();distance=Math.max(model.params.height*.8,Math.min(1800,distance*Math.exp(e.deltaY*.001)));dirty=true;};
 const key=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')az-=.12;if(e.key==='ArrowRight')az+=.12;if(e.key==='ArrowUp')elev=Math.min(Math.PI/2-.001,elev+.12);if(e.key==='ArrowDown')elev=Math.max(-Math.PI/2+.001,elev-.12);if(e.key==='+')distance*=.9;if(e.key==='-')distance*=1.1;dirty=true;};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);
 return {fit,setModel:(m:any)=>{model=previewObject(m);dirty=true;},setAppearance:(c:string,wireframe:boolean)=>{color=c;wire=wireframe;dirty=true;},setAuto:(v:boolean)=>{auto=v;},setGrid:(v:boolean)=>{grid=v;dirty=true;},dispose:()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();canvas.remove();}};
}
