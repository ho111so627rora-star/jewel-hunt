
import { describe, it, expect } from 'vitest';
import { createCloudHandler, type StoredRoom, type CloudStore } from './handler';
function setup() {
 const rows = new Map<string, StoredRoom>();
 const db: CloudStore = {
  async load(code) { return structuredClone(rows.get(code) || null); },
  async create(room) { if(rows.has(room.code)) return false; rows.set(room.code,{code:room.code,payload:structuredClone(room),version:0}); return true; },
  async replace(room,version) { if(rows.get(room.code)?.version!==version) return false; rows.set(room.code,{code:room.code,payload:structuredClone(room),version:version+1}); return true; }
 };
 const handler=createCloudHandler(db,['https://example.com']);
 const post=(body:object,token='')=>handler(new Request('https://api.test',{method:'POST',headers:{'Content-Type':'application/json','x-jewel-token':token},body:JSON.stringify(body)}));
 return {rows,handler,post};
}
describe('cloud rooms',()=>{
 it('preserves simultaneous joins and hides private room tokens',async()=>{
  const {post,rows,handler}=setup();
  const owner=await (await post({action:'create',humanCount:4,name:'A'})).json();
  const joined=await Promise.all(['B','C','D'].map(async name=>(await post({action:'join',code:owner.code,name})).json()));
  expect(new Set(joined.map(s=>s.playerId)).size).toBe(3);
  expect(rows.get(owner.code)!.payload.seats).toHaveLength(4);
  const response=await handler(new Request('https://api.test?code='+owner.code,{headers:{'x-jewel-token':owner.token}}));
  expect(response.status).toBe(200);
  const text=await response.text();
  for(const token of [owner.token,...joined.map(s=>s.token)]) expect(text).not.toContain(token);
  expect((await handler(new Request('https://api.test?code='+owner.code))).status).toBe(400);
 });
 it('rejects unapproved browser origins and supports preflight',async()=>{
  const {handler}=setup();
  expect((await handler(new Request('https://api.test',{headers:{origin:'https://evil.test'}}))).status).toBe(403);
  const response=await handler(new Request('https://api.test',{method:'OPTIONS',headers:{origin:'https://example.com'}}));
  expect(response.status).toBe(204);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
 });
});
