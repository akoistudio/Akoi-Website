'use client';
import {useEffect,useRef,useState} from 'react';
import {createBinarySTL,stlFilename} from '@/lib/stl-download.mjs';

type Prepared={status:'preparing'|'ready'|'error';url:string;filename:string;error?:string};
export function usePreparedSTL(params:any){
 const [file,setFile]=useState<Prepared>({status:'preparing',url:'',filename:''});
 const worker=useRef<Worker|null>(null),job=useRef(0),urls=useRef(new Set<string>()),latestParams=useRef(params);latestParams.current=params;
 const finish=useRef((data:any)=>{});
 finish.current=(data:any)=>{if(data.id!==job.current)return;if(data.error){setFile({status:'error',url:'',filename:'',error:data.error});return;}
  const url=URL.createObjectURL(new Blob([data.buffer],{type:'application/octet-stream'}));urls.current.add(url);setFile(previous=>{if(previous.url){const old=previous.url;setTimeout(()=>{URL.revokeObjectURL(old);urls.current.delete(old);},60000);}return {status:'ready',url,filename:data.filename};});
 };
 useEffect(()=>{
  try{const w=new Worker(new URL('../lib/stl-worker.ts',import.meta.url),{type:'module'});worker.current=w;w.onmessage=event=>finish.current(event.data);w.onerror=()=>{w.terminate();worker.current=null;try{finish.current({id:job.current,buffer:createBinarySTL(latestParams.current),filename:stlFilename(latestParams.current)});}catch(error){finish.current({id:job.current,error:String(error)});}};}catch{worker.current=null;}
  return()=>{job.current++;worker.current?.terminate();worker.current=null;for(const url of urls.current)URL.revokeObjectURL(url);urls.current.clear();};
 },[]);
 useEffect(()=>{const id=++job.current;setFile(previous=>({...previous,status:'preparing'}));const timer=setTimeout(()=>{if(worker.current)worker.current.postMessage({id,params});else{try{finish.current({id,buffer:createBinarySTL(params),filename:stlFilename(params)});}catch(error){finish.current({id,error:String(error)});}}},180);return()=>clearTimeout(timer);},[params]);
 return file;
}
