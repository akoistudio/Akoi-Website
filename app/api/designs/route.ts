import {env} from 'cloudflare:workers';
import {designService} from '@/lib/design-service.mjs';
export const dynamic='force-dynamic';
const handler=(request:Request)=>designService(request,env.DB);
export {handler as GET,handler as POST,handler as PUT,handler as DELETE};
