import {createPreviewBuilder} from './preview-model.mjs';
import {BufferAttribute,BufferGeometry} from 'three';
import {analyzePrint} from './print-analysis.mjs';
const build=createPreviewBuilder();
self.onmessage=(event:MessageEvent)=>{
 const {id,kind,input,key}=event.data;
 try{
  const model=build(kind,input);
  // Keep cached part meshes in the worker; transfer copies of final meshes.
  // Part metadata is enough for hardware inspection in the assembly screen.
  if(model.positions){
   if(kind==='shade'&&!model.printReport)model.printReport=analyzePrint(model,[256,256,256]);
   if(!model.normals){
    const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(model.positions,3));geometry.setIndex(new BufferAttribute(model.indices,1));geometry.computeVertexNormals();model.normals=geometry.getAttribute('normal').array;geometry.dispose();
   }
   const result={...model,positions:model.positions.slice(),indices:model.indices.slice(),normals:model.normals.slice(),...(model.colors?{colors:model.colors.slice()}:{}),...(model.parts?{parts:{hardware:model.parts.hardware?{...model.parts.hardware,positions:model.parts.hardware.positions.slice(),indices:model.parts.hardware.indices.slice()}:null}}:{})};
   const transfer=[result.positions.buffer,result.indices.buffer,result.normals.buffer,...(result.colors?[result.colors.buffer]:[]),...(result.parts?.hardware?[result.parts.hardware.positions.buffer,result.parts.hardware.indices.buffer]:[])];
   self.postMessage({id,key,model:result},{transfer});
  }else self.postMessage({id,key,model});
 }catch(error){self.postMessage({id,key,error:error instanceof Error?error.message:'Could not update the preview.'});}
};
