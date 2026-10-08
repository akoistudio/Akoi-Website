// Export only on request; parameter changes stop obsolete computation.
export function createSTLExportTask({createWorker,makeFile,releaseFile,onState}) {
 let key='',params,worker=null,active=null,file=null,sequence=0;
 const state=(status,error)=>onState({status,url:file?.url||'',filename:file?.filename||'',error});
 const stop=()=>{worker?.terminate();worker=null;};
 const cancel=()=>{
  stop();
  if(active){const error=new Error('Export cancelled because the design changed.');error.name='AbortError';active.reject(error);active=null;}
 };
 const clear=()=>{if(file){releaseFile(file);file=null;}};
 const setInput=input=>{
  const next=JSON.stringify(input);if(next===key)return;
  cancel();clear();params=input;key=next;sequence++;state('idle');
 };
 const fail=error=>{stop();const pending=active;active=null;state('error',error.message);pending?.reject(error);};
 return {
  setInput,
  prepare(input){
   setInput(input);if(file)return Promise.resolve(file);if(active)return active.promise;
   const id=++sequence;
   const promise=new Promise((resolve,reject)=>{active={resolve,reject};});
   active.promise=promise;state('preparing');
   try{
    worker=createWorker();
    worker.onmessage=event=>{
     const data=event.data;if(id!==sequence||data.id!==id||!active)return;
     if(data.error){fail(new Error(data.error));return;}
     try{file=makeFile(data);stop();const pending=active;active=null;state('ready');pending.resolve(file);}catch(error){fail(error);}
    };
    worker.onerror=()=>{if(id===sequence&&active)fail(new Error('The background exporter could not finish. Please retry.'));};
    worker.postMessage({id,params});
   }catch(error){console.error('Background export failed to start:',error);fail(new Error('The background exporter could not start. Please retry in a browser with Web Worker support.'));}
   return promise;
  },
  dispose(){sequence++;cancel();clear();}
 };
}
