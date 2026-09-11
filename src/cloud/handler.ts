import { createRoomService, validateCode, type Room } from '../server/roomCore';

export type StoredRoom = { code: string; payload: Room; version: number };
export type CloudStore = {
  load(code: string): Promise<StoredRoom | null>;
  create(room: Room): Promise<boolean>;
  replace(room: Room, version: number): Promise<boolean>;
};
type Input = { action?: string; code?: string; [key: string]: unknown };

export function createCloudHandler(database: CloudStore, allowedOrigins: string[]) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    const cors: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-jewel-token',
      'Access-Control-Max-Age': '86400', 'Vary': 'Origin', 'Cache-Control': 'no-store',
    };
    if (origin && allowedOrigins.includes(origin)) cors['Access-Control-Allow-Origin'] = origin;
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
    if (origin && !allowedOrigins.includes(origin)) return json({ error: 'この公開URLからは接続できません' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!['GET', 'POST'].includes(request.method)) return json({ error: '対応していない操作です' }, 405);
    try {
      let data: Input;
      if (request.method === 'GET') data = { code: new URL(request.url).searchParams.get('code') || '' };
      else {
        const body = await request.text();
        if (body.length > 16_384) return json({ error: 'リクエストが大きすぎます' }, 413);
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: '操作データが無効です' }, 400);
        data = parsed;
      }
      const token = request.headers.get('x-jewel-token') || '';
      const creating = request.method === 'POST' && data.action === 'create';
      const code = String(data.code || '').toUpperCase();
      if (!creating) validateCode(code);
      for (let attempt = 0; attempt < 8; attempt++) {
        const snapshot = creating ? null : await database.load(code);
        let current = snapshot ? structuredClone(snapshot.payload) : undefined;
        let saved: Room | undefined;
        const service = createRoomService({
          exists: candidate => !!current && candidate === current.code,
          read: () => structuredClone(current!),
          write: room => { saved = structuredClone(room); current = saved; },
        });
        let result: unknown, failure: unknown;
        try {
          if (request.method === 'GET') result = service.getRoom(code, token);
          else if (creating) result = service.createRoom(Number(data.humanCount), data.name);
          else if (data.action === 'join') result = service.joinRoom(code, data.name);
          else result = service.act(code, token, String(data.action), data);
        } catch (error) { failure = error; }
        if (saved && (!snapshot || JSON.stringify(saved) !== JSON.stringify(snapshot.payload))) {
          const committed = snapshot ? await database.replace(saved, snapshot.version) : await database.create(saved);
          if (!committed) continue;
        }
        if (failure) return json({ error: failure instanceof Error ? failure.message : '操作に失敗しました' }, 400);
        return json(result);
      }
      return json({ error: '同時操作が重なりました。もう一度お試しください' }, 409);
    } catch {
      return json({ error: '接続に失敗しました。少し待って再度お試しください' }, 503);
    }
  };
}
