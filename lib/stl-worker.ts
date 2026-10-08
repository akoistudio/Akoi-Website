import {createBinarySTL,stlFilename} from './stl-download.mjs';
self.onmessage=(event:MessageEvent)=>{const {id,params}=event.data;try{const buffer=createBinarySTL(params);self.postMessage({id,buffer,filename:stlFilename(params)}, {transfer:[buffer]});}catch(error){self.postMessage({id,error:error instanceof Error?error.message:'Unable to prepare STL.'});}};
