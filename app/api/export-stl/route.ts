import {createSTLResponse} from '@/lib/stl-download.mjs';
export const dynamic='force-dynamic';
export function GET(request:Request){return createSTLResponse(request);}
