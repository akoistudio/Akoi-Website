'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createSTLExportTask} from '@/lib/stl-export-task.mjs';
import STLWorker from '../lib/stl-worker.ts?worker';

type FileData={url:string;filename:string};
type Prepared=FileData&{status:'idle'|'preparing'|'ready'|'error';error?:string};
type Task=ReturnType<typeof createSTLExportTask>;
export function usePreparedSTL(params:unknown){
 const [file,setFile]=useState<Prepared>({status:'idle',url:'',filename:''});
 const task=useRef<Task|null>(null),latest=useRef(params),downloadJob=useRef<Promise<void>|null>(null);
 const getTask=useCallback(()=>task.current??(task.current=createSTLExportTask({
  createWorker:()=>new STLWorker(),
  makeFile:(data:{buffer:ArrayBuffer;filename:string})=>({url:URL.createObjectURL(new Blob([data.buffer],{type:'application/octet-stream'})),filename:data.filename}),
  releaseFile:(old:FileData)=>URL.revokeObjectURL(old.url),onState:(next:Prepared)=>setFile(next)
 })),[]);
 useLayoutEffect(()=>{latest.current=params;getTask().setInput(params);},[params,getTask]);
 useEffect(()=>()=>{task.current?.dispose();task.current=null;},[]);
 const prepare=useCallback(()=>getTask().prepare(latest.current) as Promise<FileData>,[getTask]);
 const download=useCallback(()=>{
  if(downloadJob.current)return downloadJob.current;
  const job=prepare().then(ready=>{
   const anchor=document.createElement('a');anchor.href=ready.url;anchor.download=ready.filename;
   document.body.appendChild(anchor);anchor.click();anchor.remove();
  }).finally(()=>{downloadJob.current=null;});
  downloadJob.current=job;return job;
 },[prepare]);
 return {...file,prepare,download};
}
