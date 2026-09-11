import { createCloudHandler, type StoredRoom } from './handler';
import type { Room } from '../server/roomCore';
declare const Deno: { env: { get(key: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowed = (Deno.env.get('JEWEL_ALLOWED_ORIGINS') || 'https://ho111so627rora-star.github.io').split(',').map(s => s.trim());
async function database(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('apikey', key); headers.set('Authorization', 'Bearer ' + key);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(url + '/rest/v1/jewel_rooms' + path, { ...init, headers });
  if (!response.ok && response.status !== 409) throw new Error('Database request failed');
  return response;
}
Deno.serve(createCloudHandler({
  async load(code) {
    const response = await database('?code=eq.' + encodeURIComponent(code) + '&select=code,payload,version');
    return ((await response.json()) as StoredRoom[])[0] || null;
  },
  async create(room: Room) {
    return (await database('', { method: 'POST', body: JSON.stringify({ code: room.code, payload: room, version: 0 }) })).status !== 409;
  },
  async replace(room: Room, version: number) {
    const response = await database('?code=eq.' + encodeURIComponent(room.code) + '&version=eq.' + version, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ payload: room, version: version + 1, updated_at: new Date().toISOString() }),
    });
    return ((await response.json()) as unknown[]).length === 1;
  },
}, allowed));
