import assert from 'node:assert/strict';
import {createSTLExportTask} from '../lib/stl-export-task.mjs';

const workers=[],released=[],states=[];
const task=createSTLExportTask({
 createWorker:()=>{const worker={terminated:false,messages:[],postMessage(message){this.messages.push(message);},terminate(){this.terminated=true;}};workers.push(worker);return worker;},
 makeFile:data=>({url:`blob:${data.id}`,filename:data.filename}),
 releaseFile:file=>released.push(file.url),onState:state=>states.push(state)
});
task.setInput({height:200});task.setInput({height:210});
assert.equal(workers.length,0,'editing never starts STL preparation');
const first=task.prepare({height:210}),duplicate=task.prepare({height:210});
assert.equal(first,duplicate,'repeated clicks share a single export');assert.equal(workers.length,1);
const old=workers[0],oldMessage=old.messages[0];
const cancelled=assert.rejects(first,{name:'AbortError'});
task.setInput({height:220});await cancelled;assert.equal(old.terminated,true,'editing stops computation');
const second=task.prepare({height:220}),current=workers[1],message=current.messages[0];
old.onmessage({data:{id:oldMessage.id,buffer:new ArrayBuffer(1),filename:'stale.stl'}});
old.onerror();assert.equal(current.terminated,false,'late errors from cancelled work cannot stop a new export');
assert.equal(states.at(-1).status,'preparing');
current.onmessage({data:{id:message.id,buffer:new ArrayBuffer(1),filename:'current.stl'}});
const file=await second;assert.equal(file.filename,'current.stl');assert.equal(current.terminated,true);
assert.equal(await task.prepare({height:220}),file,'unchanged exports reuse the prepared file');assert.equal(workers.length,2);
task.setInput({height:230});assert.deepEqual(released,[file.url],'obsolete files are released without accumulating URLs');
const failure=task.prepare({height:230});const rejected=assert.rejects(failure,/bad geometry/);
workers[2].onmessage({data:{id:workers[2].messages[0].id,error:'bad geometry'}});await rejected;
assert.equal(states.at(-1).status,'error');
const retry=task.prepare({height:230});const aborted=assert.rejects(retry,{name:'AbortError'});task.dispose();await aborted;
assert.equal(workers.at(-1).terminated,true,'unmount stops active work');
console.log('Export lifecycle checks passed: lazy generation, deduplication, cancellation, stale results/errors, cache, release, retry and teardown.');
