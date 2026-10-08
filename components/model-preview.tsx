'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createSoftwarePreview} from '@/lib/software-preview';
import {Maximize,RotateCw,Grid2X2,Box,Scan,Pause} from 'lucide-react';

type Props={model:any;color:string;wireframe:boolean;setWireframe:(v:boolean)=>void;view:string;setView:(v:string)=>void};
export default function ModelPreview({model,color,wireframe,setWireframe,view,setView}:Props){
 const host=useRef<HTMLDivElement>(null),api=useRef<any>(null),[error,setError]=useState(''),[spin,setSpin]=useState(false),[grid,setGrid]=useState(true);
 const latest=useRef(model);latest.current=model;
 useEffect(()=>{
  if(!host.current)return;const el=host.current;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{const fallback=createSoftwarePreview(el,latest.current,color);api.current=fallback;setError('Software 3D preview');return()=>{fallback.dispose();api.current=null;};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive 3D model. Drag to orbit, scroll to zoom.');renderer.domElement.tabIndex=0;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,4000),controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=true;controls.minDistance=35;controls.maxDistance=1800;controls.autoRotateSpeed=1.3;
  scene.add(new THREE.HemisphereLight(0xffffff,0x8d8272,2.6));
  const key=new THREE.DirectionalLight(0xfff9ed,4.5);key.position.set(-220,350,270);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-350;key.shadow.camera.right=350;key.shadow.camera.top=450;key.shadow.camera.bottom=-300;key.shadow.bias=-.0004;scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.8);fill.position.set(260,160,-160);scene.add(fill);
  const material=new THREE.MeshPhysicalMaterial({color,roughness:.66,metalness:.04,side:THREE.DoubleSide,clearcoat:.08});
  const shellMaterial=material.clone();shellMaterial.transparent=true;shellMaterial.opacity=.25;shellMaterial.depthWrite=false;shellMaterial.roughness=.25;
  const cavityMaterial=material.clone();cavityMaterial.color.multiplyScalar(.7);
  const mesh=new THREE.Mesh(new THREE.BufferGeometry(),[material,cavityMaterial,shellMaterial]);mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),new THREE.ShadowMaterial({opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-1;floor.receiveShadow=true;scene.add(floor);
  const lines=new THREE.GridHelper(1000,40,0xbfb7a9,0xd1cbbf);lines.position.y=-.8;const lineMat=lines.material as THREE.Material;lineMat.transparent=true;lineMat.opacity=.42;scene.add(lines);
  const fit=(mode='perspective')=>{const p=latest.current.params,s=Math.max(p.height,Math.max(p.diameter,p.topDiameter)*Math.max(1,p.depthRatio/100)*1.42)+100;controls.target.set(0,mode==='bottom'?0:p.height/2,0);if(mode==='bottom')camera.position.set(.01,-s*1.45,.01);else if(mode==='front')camera.position.set(0,p.height/2,s*1.7);else if(mode==='top')camera.position.set(.01,p.height+s*1.45,.01);else camera.position.set(s*1.05,p.height/2+s*.45,s*1.25);camera.lookAt(controls.target);controls.update();};
  api.current={fit,setModel:(m:any)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));if(m.colors)g.setAttribute('color',new THREE.BufferAttribute(m.colors,3));material.vertexColors=!!m.colors;cavityMaterial.vertexColors=!!m.colors;if(m.colors){material.color.set('#ffffff');cavityMaterial.color.copy(material.color).multiplyScalar(.7);}shellMaterial.vertexColors=!!m.colors;shellMaterial.color.set(m.colors?'#ffffff':color);shellMaterial.needsUpdate=true;material.needsUpdate=true;cavityMaterial.needsUpdate=true;g.computeVertexNormals();let groupStart=0,groupMat=0;for(let i=0;i<m.indices.length;i+=3){const mat=m.outerIndexCount&&i<m.outerIndexCount?2:[m.indices[i],m.indices[i+1],m.indices[i+2]].every(id=>Math.abs(m.positions[id*3+2]-(m.params.kind==='base'?m.params.height-3.3:3.3))<.001)?1:0;if(mat!==groupMat){if(i>groupStart)g.addGroup(groupStart,i-groupStart,groupMat);groupStart=i;groupMat=mat;}}g.addGroup(groupStart,m.indices.length-groupStart,groupMat);mesh.geometry.dispose();mesh.geometry=g;},setAppearance:(c:string,w:boolean)=>{shellMaterial.color.set(latest.current.colors?'#ffffff':c);shellMaterial.wireframe=w;material.color.set(latest.current.colors?'#ffffff':c);material.wireframe=w;cavityMaterial.color.set(latest.current.colors?'#ffffff':c).multiplyScalar(.7);cavityMaterial.wireframe=w;},setAuto:(v:boolean)=>{controls.autoRotate=v;},setGrid:(v:boolean)=>{lines.visible=v;floor.visible=v;}};fit();
  const ro=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});ro.observe(el);
  let frame=0;const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)};animate();
  const onKey=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();const relative=camera.position.clone().sub(controls.target);const sph=new THREE.Spherical().setFromVector3(relative);if(e.key==='ArrowLeft')sph.theta-=.12;if(e.key==='ArrowRight')sph.theta+=.12;if(e.key==='ArrowUp')sph.phi=Math.max(.01,sph.phi-.12);if(e.key==='ArrowDown')sph.phi=Math.min(Math.PI-.01,sph.phi+.12);if(e.key==='+')sph.radius*=.9;if(e.key==='-')sph.radius*=1.1;camera.position.copy(new THREE.Vector3().setFromSpherical(sph).add(controls.target));controls.update();}};renderer.domElement.addEventListener('keydown',onKey);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();controls.dispose();mesh.geometry.dispose();material.dispose();cavityMaterial.dispose();shellMaterial.dispose();floor.geometry.dispose();(floor.material as THREE.Material).dispose();lines.geometry.dispose();lineMat.dispose();renderer.dispose();renderer.domElement.removeEventListener('keydown',onKey);renderer.domElement.remove();api.current=null;};
 },[]);
 useEffect(()=>{api.current?.setModel(model);if(model.params.kind==='assembly')api.current?.fit(view);},[model]);
 useEffect(()=>{api.current?.setAppearance(color,wireframe);},[color,wireframe,model]);
 useEffect(()=>{api.current?.setAuto(spin);},[spin]);
 useEffect(()=>{api.current?.setGrid(grid&&view!=='bottom');api.current?.fit(view);},[view,grid]);
 return <><div ref={host} className="canvas-host" data-testid="model-canvas"/>{error&&<div className="software-label">{error}</div>}<div className="view-tools"><button aria-label="Fit model in view" title="Fit model" onClick={()=>api.current?.fit(view)}><Maximize size={18}/></button><button aria-label={spin?'Pause rotation':'Rotate automatically'} aria-pressed={spin} title="Auto rotate" onClick={()=>setSpin(!spin)}>{spin?<Pause size={18}/>:<RotateCw size={18}/>}</button><button aria-label="Toggle grid" aria-pressed={grid} title="Grid" onClick={()=>setGrid(!grid)}><Grid2X2 size={18}/></button><button aria-label="Toggle wireframe" aria-pressed={wireframe} title="Wireframe" onClick={()=>setWireframe(!wireframe)}><Box size={18}/></button></div><div className="view-presets">{[['perspective','3D'],['front','Front'],['top','Top'],['bottom','Bottom']].map(([v,label])=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)} aria-pressed={view===v}>{label}</button>)}</div><div className="orbit-hint"><Scan size={15}/> Drag to orbit · Scroll to zoom</div></>;
}
