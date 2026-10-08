'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import PreviewWorker from '../lib/preview-worker.ts?worker';

type Job={id:number;kind:string;input:unknown;key:string};
type Reply<T>={id:number;key:string;model?:T;error?:string};
// At most one running request and one latest pending request. Keep the previous
// preview visible while the worker updates it, without blocking controls.
export function usePreviewModel<T>(kind:string,input:unknown,initial:T,enabled=true){
 const [result,setResult]=useState({model:initial,key:'',error:''});
 const worker=useRef<Worker|null>(null),sequence=useRef(0),running=useRef(false),pending=useRef<Job|null>(null),latestKey=useRef('');
 const key=JSON.stringify(input);
 const send=useCallback(()=>{
  if(running.current||!pending.current||!worker.current)return;
  const job=pending.current;pending.current=null;running.current=true;worker.current.postMessage(job);
 },[]);
 useEffect(()=>{
  if(!enabled)return;
  let active=true;
  try{
   const w=new PreviewWorker();worker.current=w;
   w.onmessage=(event:MessageEvent<Reply<T>>)=>{if(!active)return;running.current=false;const data=event.data;if(data.id===sequence.current)setResult(previous=>({model:data.model??previous.model,key:data.key,error:data.error||''}));send();};
   w.onerror=()=>{if(!active)return;running.current=false;pending.current=null;setResult(previous=>({...previous,key:latestKey.current,error:'The preview could not update. Reload the page to retry.'}));};
  }catch(error){console.error('Background preview failed to start:',error);queueMicrotask(()=>{if(active)setResult(previous=>({...previous,key:latestKey.current,error:'This browser cannot run the background preview. Use a browser with Web Worker support.'}));});}
  return()=>{active=false;worker.current?.terminate();worker.current=null;pending.current=null;running.current=false;};
 },[enabled,send]);
 useEffect(()=>{
  if(!enabled)return;
  latestKey.current=key;
  const id=++sequence.current;
  const timer=setTimeout(()=>{pending.current={id,kind,input,key};send();},60);
  return()=>{clearTimeout(timer);pending.current=null;};
  // The serialized key changes only when an input value changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[kind,key,enabled,send]);
 return {model:result.model,updating:enabled&&result.key!==key,error:result.error};
}

type PreviewParams={height:number;diameter?:number;topDiameter?:number;depthRatio?:number;kind?:string;source?:{topDiameter:number}};
type Mesh={positions:Float32Array;indices:Uint32Array;colors?:Float32Array;params:PreviewParams;pockets:unknown[];parts:{hardware:Mesh|null}};
export function emptyPreview(params:PreviewParams):Mesh{
 return {positions:new Float32Array(),indices:new Uint32Array(),params:{...params,diameter:params.diameter??params.source?.topDiameter??100,topDiameter:params.topDiameter??params.source?.topDiameter??100,depthRatio:params.depthRatio??100},pockets:[],parts:{hardware:null}};
}
