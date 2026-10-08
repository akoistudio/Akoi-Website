import {validateProject} from './design-project.mjs';
export async function designService(request,db){
 const owner=request.headers.get('oai-authenticated-user-id');
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
 if(!owner)return reply({error:'Open the private studio with your existing ChatGPT session to use saved designs.'},401);
 try{
  const id=new URL(request.url).searchParams.get('id');
  if(request.method==='GET'){
   const {results}=await db.prepare('SELECT id, name, payload, updated_at FROM designs WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100').bind(owner).all();
   return reply({designs:results.map(row=>({id:row.id,name:row.name,project:validateProject(JSON.parse(row.payload)),updatedAt:row.updated_at}))});
  }
  if(request.method==='DELETE'){
   if(!id)return reply({error:'Choose a saved design.'},400);
   const result=await db.prepare('DELETE FROM designs WHERE id = ? AND owner_id = ?').bind(id,owner).run();
   return result.meta.changes?reply({deleted:true}):reply({error:'Design not found.'},404);
  }
  if(!['POST','PUT'].includes(request.method))return reply({error:'Method not supported.'},405);
  const raw=await request.text();if(raw.length>16000)return reply({error:'Project file is too large.'},413);
  const input=JSON.parse(raw),name=typeof input.name==='string'?input.name.trim():'';
  if(!name||name.length>80)return reply({error:'Use a design name of 1–80 characters.'},400);
  const project=validateProject(input.project);
  if(request.method==='PUT'){
   if(!id)return reply({error:'Choose a saved design to update.'},400);
   const now=new Date().toISOString();
   const result=await db.prepare('UPDATE designs SET name = ?, payload = ?, updated_at = ? WHERE id = ? AND owner_id = ?').bind(name,JSON.stringify(project),now,id,owner).run();
   if(!result.meta.changes)return reply({error:'The saved design was not found. Use Save as to create a new file.'},404);
   return reply({design:{id,name,project,updatedAt:now}});
  }
  const count=await db.prepare('SELECT COUNT(*) AS total FROM designs WHERE owner_id = ?').bind(owner).first();
  if(count.total>=100)return reply({error:'Your collection has 100 designs. Delete an old design or download a project file.'},409);
  const savedId=crypto.randomUUID(),now=new Date().toISOString();
  await db.prepare('INSERT INTO designs (id, owner_id, name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(savedId,owner,name,JSON.stringify(project),now,now).run();
  return reply({design:{id:savedId,name,project,updatedAt:now}},201);
 }catch(error){return reply({error:error instanceof Error?error.message:'The design could not be saved.'},400);}
}
